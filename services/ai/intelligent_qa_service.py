import logging
from typing import Dict, List, Optional, Any
import asyncio
import time
from datetime import datetime
import re
import uuid

# Services
from .qdrant_service import qdrant_service
from .embedding_service import embedding_service
from .gemini_service import gemini_service
from .web_scraping_service import web_scraping_service
from services.repositories.qa_pair_repository import qa_pair_repository
from services.database.database import get_db
from config.logging_config import (
    get_logger,
    log_function_entry,
    log_function_exit,
    log_performance,
    log_error_with_context,
)

logger = get_logger(__name__)


class IntelligentQAService:
    """
    Enhanced intelligent Q&A processing service with web scraping integration.
    
    New Flow:
    1. Receive question
    2. Generate embedding using latest GenAI
    3. Semantic search in Qdrant
    4. If high similarity found -> return stored answer from PostgreSQL
    5. If no match -> fetch fresh content from web scraping
    6. Generate new answer with Gemini + web content
    7. Store in both Qdrant and PostgreSQL
    8. Generate question variants and store them
    """

    def __init__(self):
        log_function_entry(logger, "__init__")
        start_time = time.time()

        logger.debug("🔧 Initializing Enhanced IntelligentQAService...")
        self.semantic_search_threshold: float = 0.85   # consider candidates above this
        self.quality_threshold: float = 0.95           # return immediately if >= this
        self.max_variants_to_generate: int = 5
        self._initialized: bool = False

        duration = time.time() - start_time
        logger.debug(
            f"✅ Enhanced IntelligentQAService initialized (semantic≥{self.semantic_search_threshold}, quality≥{self.quality_threshold})"
        )
        log_performance(logger, "Enhanced IntelligentQAService initialization", duration)
        log_function_exit(logger, "__init__", duration=duration)

    async def initialize_system(self) -> Dict[str, Any]:
        """
        Initialize the Q&A system including knowledge base loading.
        Call this during application startup.
        """
        log_function_entry(logger, "initialize_system")
        start_time = time.time()

        logger.info("🚀 Initializing Enhanced Syria GPT Q&A system...")

        try:
            # Ensure Qdrant collection exists
            await qdrant_service._ensure_collection_exists()
            
            # Test all services
            health_checks = await self._check_system_health()
            
            # Count healthy services
            healthy_services = sum(1 for check in health_checks.values() if check.get("status") == "healthy")
            total_services = len(health_checks)
            
            # Allow initialization if core services (Qdrant and Embedding) are healthy
            # Gemini can be unhealthy due to quota limits, but system should still work
            core_services = ["qdrant", "embedding"]
            core_healthy = sum(1 for service in core_services if health_checks.get(service, {}).get("status") == "healthy")
            
            if core_healthy == len(core_services):
                self._initialized = True
                duration = time.time() - start_time
                log_performance(logger, "System initialization", duration)
                logger.info(f"✅ Enhanced Syria GPT Q&A system initialized successfully ({healthy_services}/{total_services} services healthy)")
                return {"status": "success", "health_checks": health_checks, "healthy_count": healthy_services}
            else:
                error_msg = f"Core services are unhealthy ({core_healthy}/{len(core_services)} core services healthy)"
                logger.error(f"❌ Failed to initialize system: {error_msg}")
                log_error_with_context(
                    logger, Exception(error_msg), "initialize_system", health_checks=health_checks
                )
                return {"status": "error", "error": error_msg, "health_checks": health_checks}

        except Exception as e:
            duration = time.time() - start_time
            log_error_with_context(logger, e, "initialize_system", duration=duration)
            logger.error(f"❌ System initialization failed: {e}")
            log_function_exit(logger, "initialize_system", duration=duration)
            return {"status": "error", "error": str(e)}

    async def _check_system_health(self) -> Dict[str, Any]:
        """Check health of all system components"""
        health_checks = {}
        
        # Check Qdrant
        try:
            qdrant_stats = await qdrant_service.get_collection_stats()
            health_checks["qdrant"] = {
                "status": "healthy" if qdrant_stats.get("connected") else "unhealthy",
                "details": qdrant_stats
            }
        except Exception as e:
            health_checks["qdrant"] = {"status": "unhealthy", "error": str(e)}
        
        # Check embedding service
        try:
            embedding_health = await embedding_service.get_system_health()
            health_checks["embedding"] = {
                "status": "healthy" if embedding_health.get("available") else "unhealthy",
                "details": embedding_health
            }
        except Exception as e:
            health_checks["embedding"] = {"status": "unhealthy", "error": str(e)}
        
        # Check Gemini service
        try:
            gemini_health = await gemini_service.get_system_health()
            health_checks["gemini"] = {
                "status": "healthy" if gemini_health.get("connected") else "unhealthy",
                "details": gemini_health
            }
        except Exception as e:
            health_checks["gemini"] = {"status": "unhealthy", "error": str(e)}
        
        # Check web scraping service
        try:
            health_checks["web_scraping"] = {
                "status": "healthy",
                "details": {"initialized": True}
            }
        except Exception as e:
            health_checks["web_scraping"] = {"status": "unhealthy", "error": str(e)}
        
        return health_checks

    async def ensure_initialized(self):
        """Ensure the system is initialized before processing questions."""
        log_function_entry(logger, "ensure_initialized", initialized=self._initialized)
        start_time = time.time()

        if not self._initialized:
            logger.info("🔄 System not initialized, initializing now...")
            await self.initialize_system()
            duration = time.time() - start_time
            log_performance(logger, "System initialization check", duration)
        else:
            logger.debug("✅ System already initialized")
            duration = time.time() - start_time
            log_performance(logger, "System initialization check (already initialized)", duration)

        log_function_exit(logger, "ensure_initialized", duration=duration)

    async def process_question(
        self,
        question: str,
        user_id: Optional[str] = None,
        context: Optional[str] = None,
        language: str = "auto",
    ) -> Dict[str, Any]:
        """
        Main processing pipeline for user questions with enhanced flow.
        """
        log_function_entry(
            logger,
            "process_question",
            question_length=len(question),
            user_id=user_id,
            has_context=bool(context),
            language=language,
        )
        start_time = time.time()
        processing_steps: List[str] = []

        try:
            # 0) Ensure initialization
            await self.ensure_initialized()

            # 1) Normalize question
            normalized_question = self._normalize_question(question)
            processing_steps.append("input_normalized")

            # 2) Generate embedding using latest GenAI
            logger.info("🔍 Step 1: Generating question embedding...")
            question_embedding = await embedding_service.generate_embedding(normalized_question)
            if not question_embedding:
                logger.error("Failed to generate embedding for question")
                return self._format_error(
                    "Unable to process question due to embedding service failure",
                    processing_steps,
                    reason="embedding_failure",
                )
            processing_steps.append("embedding_generated")

            # 3) Semantic Search in Qdrant
            logger.info("🔍 Step 2: Performing semantic search in Qdrant...")
            similar_qa_pairs = await qdrant_service.search_similar_questions(
                query_embedding=question_embedding,
                limit=5,
                score_threshold=self.semantic_search_threshold,
            )

            if similar_qa_pairs:
                processing_steps.append("semantic_search_hit")
                best_match = similar_qa_pairs[0]  # Highest similarity first

                if best_match.get("similarity_score", 0.0) >= self.quality_threshold:
                    logger.info("✅ High-quality match found - retrieving from PostgreSQL")
                    
                    # Get the complete answer from PostgreSQL
                    db = next(get_db())
                    qa_pair = qa_pair_repository.get_qa_pair_by_question_id(
                        db, best_match.get("qa_id", "")
                    )
                    
                    if qa_pair:
                        return self._format_response(
                            answer=qa_pair.answer_text,
                            source="vector_search",
                            confidence=best_match["similarity_score"],
                            processing_steps=processing_steps,
                            processing_time=time.time() - start_time,
                            metadata={
                                "similar_questions": [qa["question"] for qa in similar_qa_pairs[:3]],
                                "original_qa_id": best_match.get("qa_id"),
                                "postgresql_id": str(qa_pair.id),
                            },
                        )

            processing_steps.append("semantic_search_miss_or_low_quality")

            # 4) Fetch fresh content from web scraping
            logger.info("🔍 Step 3: Fetching fresh content from web scraping...")
            web_context = await web_scraping_service.get_content_for_context(
                normalized_question, max_articles=5
            )
            processing_steps.append("web_content_fetched")

            # 5) Generate new answer with Gemini + web content
            logger.info("🔍 Step 4: Generating new answer with Gemini...")
            try:
                gemini_response = await gemini_service.answer_question(
                    question=normalized_question,
                    context=web_context if web_context else context,
                    language=language,
                    previous_qa_pairs=similar_qa_pairs[:3] if similar_qa_pairs else None,
                )
                processing_steps.append("gemini_api_success")
            except Exception as e:
                logger.warning(f"⚠️ Gemini API failed: {e}")
                processing_steps.append("gemini_api_failed")
                
                # Fallback: Return best match from vector search if available
                if similar_qa_pairs and similar_qa_pairs[0].get("similarity_score", 0.0) >= 0.3:
                    logger.info("🔄 Using fallback: returning best match from vector search")
                    best_match = similar_qa_pairs[0]
                    
                    # Get the complete answer from PostgreSQL
                    db = next(get_db())
                    qa_pair = qa_pair_repository.get_qa_pair_by_question_id(
                        db, best_match.get("qa_id", "")
                    )
                    
                    if qa_pair:
                        return self._format_response(
                            answer=qa_pair.answer_text,
                            source="vector_search_fallback",
                            confidence=best_match["similarity_score"],
                            processing_steps=processing_steps,
                            processing_time=time.time() - start_time,
                            metadata={
                                "similar_questions": [qa["question"] for qa in similar_qa_pairs[:3]],
                                "original_qa_id": best_match.get("qa_id"),
                                "postgresql_id": str(qa_pair.id),
                                "fallback_reason": "gemini_api_unavailable",
                                "gemini_error": str(e)
                            },
                        )
                
                # If no fallback available, return error
                return self._format_error(
                    f"Unable to generate answer: Gemini API unavailable ({str(e)})",
                    processing_steps,
                    reason="generation_failure",
                )

            # 6) Store in PostgreSQL and Qdrant
            logger.info("🔍 Step 5: Storing new Q&A pair...")
            storage_success = await self._store_new_qa_pair(
                question=normalized_question,
                answer=gemini_response["answer"],
                embedding=question_embedding,
                confidence=gemini_response.get("confidence", 0.8),
                metadata={
                    "language": gemini_response.get("language", language),
                    "sources": gemini_response.get("sources", []),
                    "keywords": gemini_response.get("keywords", []),
                    "web_context_used": bool(web_context),
                    "created_at": datetime.now().isoformat(),
                    "model_used": gemini_response.get("model_used", "gemini-1.5-flash"),
                    "user_id": user_id,
                },
                user_id=user_id,
            )

            processing_steps.append("answer_stored" if storage_success else "storage_failed")

            # 7) Generate and store question variants
            logger.info("🔍 Step 6: Generating question variants...")
            await self._generate_and_store_variants(
                normalized_question, 
                gemini_response["answer"], 
                question_embedding,
                user_id
            )
            processing_steps.append("variants_generated")

            # 8) Return final response
            return self._format_response(
                answer=gemini_response["answer"],
                source="gemini_api",
                confidence=gemini_response.get("confidence", 0.8),
                processing_steps=processing_steps,
                processing_time=time.time() - start_time,
                metadata={
                    "sources": gemini_response.get("sources", []),
                    "keywords": gemini_response.get("keywords", []),
                    "web_context_used": bool(web_context),
                    "processing_time": gemini_response.get("processing_time", 0),
                },
            )

        except Exception as e:
            logger.error(f"Error in question processing pipeline: {e}")
            return self._format_error(
                f"Processing error: {str(e)}", processing_steps, reason="internal_error"
            )

    async def _store_new_qa_pair(
        self,
        question: str,
        answer: str,
        embedding: List[float],
        confidence: float,
        metadata: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> bool:
        """
        Store the new Q&A pair in both PostgreSQL and Qdrant.
        """
        try:
            # Generate unique Q&A ID
            qa_id = f"qa_{abs(hash(question))}_{int(time.time())}"
            
            # Store in PostgreSQL
            db = next(get_db())
            qa_pair = qa_pair_repository.create_qa_pair(
                db=db,
                question_text=question,
                answer_text=answer,
                user_id=uuid.UUID(user_id) if user_id else None,
                confidence=confidence,
                source=metadata.get("model_used", "gemini_api"),
                language=metadata.get("language", "auto"),
                metadata={**metadata, "qa_id": qa_id}
            )
            
            if not qa_pair:
                logger.error("Failed to store Q&A pair in PostgreSQL")
                return False
            
            # Store in Qdrant
            qdrant_success = await qdrant_service.store_qa_embedding(
                qa_id=qa_id,
                question=question,
                answer=answer,
                embedding=embedding,
                metadata={**metadata, "qa_id": qa_id, "postgresql_id": str(qa_pair.id)}
            )
            
            if not qdrant_success:
                logger.warning("Failed to store Q&A pair in Qdrant, but PostgreSQL storage succeeded")
            
            logger.info(f"Stored new Q&A pair with ID: {qa_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to store new Q&A pair: {e}")
            return False

    async def _generate_and_store_variants(
        self,
        original_question: str,
        answer: str,
        original_embedding: List[float],
        user_id: Optional[str] = None
    ):
        """
        Generate question variants and store them in Qdrant.
        """
        try:
            # Generate variants using Gemini
            variants = await gemini_service.generate_question_variants(
                original_question, self.max_variants_to_generate
            )
            
            # Store variants in Qdrant (not PostgreSQL to avoid duplication)
            for variant in variants:
                try:
                    # Generate embedding for variant
                    variant_embedding = await embedding_service.generate_embedding(variant)
                    if variant_embedding:
                        await qdrant_service.store_qa_embedding(
                            qa_id=f"variant_{abs(hash(variant))}_{int(time.time())}",
                            question=variant,
                            answer=answer,
                            embedding=variant_embedding,
                            metadata={
                                "is_variant": True,
                                "original_question": original_question,
                                "user_id": user_id,
                                "created_at": datetime.now().isoformat()
                            }
                        )
                except Exception as e:
                    logger.warning(f"Failed to store variant '{variant}': {e}")
                    continue
            
            logger.info(f"Generated and stored {len(variants)} question variants")
            
        except Exception as e:
            logger.error(f"Failed to generate and store variants: {e}")

    async def find_similar_questions(
        self,
        question: str,
        limit: int = 5,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar questions using semantic search.
        """
        try:
            # Generate embedding
            embedding = await embedding_service.generate_embedding(question)
            if not embedding:
                return []
            
            # Search in Qdrant
            similar_qa_pairs = await qdrant_service.search_similar_questions(
                query_embedding=embedding,
                limit=limit,
                score_threshold=0.7,  # Lower threshold for suggestions
            )
            
            # Get full details from PostgreSQL
            db = next(get_db())
            results = []
            
            for qa_pair in similar_qa_pairs:
                postgres_qa = qa_pair_repository.get_qa_pair_by_question_id(
                    db, qa_pair.get("qa_id", "")
                )
                
                if postgres_qa:
                    results.append({
                        "question": postgres_qa.question_text,
                        "answer": postgres_qa.answer_text,
                        "similarity_score": qa_pair.get("similarity_score", 0.0),
                        "confidence": postgres_qa.confidence,
                        "source": postgres_qa.source,
                        "created_at": postgres_qa.created_at.isoformat()
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to find similar questions: {e}")
            return []

    async def augment_question_variants(
        self,
        question: str,
        answer: str,
        user_id: Optional[str] = None
    ) -> List[str]:
        """
        Generate and store question variants for a validated Q&A pair.
        """
        try:
            # Generate variants
            variants = await gemini_service.generate_question_variants(
                question, self.max_variants_to_generate
            )
            
            # Store variants in Qdrant
            for variant in variants:
                try:
                    variant_embedding = await embedding_service.generate_embedding(variant)
                    await qdrant_service.store_qa_embedding(
                        qa_id=f"augment_{abs(hash(variant))}_{int(time.time())}",
                        question=variant,
                        answer=answer,
                        embedding=variant_embedding,
                        metadata={
                            "is_augmented": True,
                            "original_question": question,
                            "user_id": user_id,
                            "created_at": datetime.now().isoformat()
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to store augmented variant '{variant}': {e}")
                    continue
            
            logger.info(f"Augmented {len(variants)} question variants")
            return variants
            
        except Exception as e:
            logger.error(f"Failed to augment question variants: {e}")
            return []

    async def check_gemini_quota(self) -> Dict[str, Any]:
        """Check Gemini API quota status"""
        try:
            # Try a simple test call to check quota
            test_response = await gemini_service.answer_question(
                question="test",
                context="test",
                language="en"
            )
            return {
                "status": "available",
                "quota_remaining": "unknown",
                "details": "API is responding normally"
            }
        except Exception as e:
            error_str = str(e)
            if "429" in error_str and "quota" in error_str.lower():
                return {
                    "status": "quota_exceeded",
                    "quota_remaining": 0,
                    "details": "Daily quota limit exceeded",
                    "error": error_str
                }
            elif "401" in error_str or "403" in error_str:
                return {
                    "status": "unauthorized",
                    "quota_remaining": 0,
                    "details": "API key invalid or unauthorized",
                    "error": error_str
                }
            else:
                return {
                    "status": "error",
                    "quota_remaining": "unknown",
                    "details": "Unknown error",
                    "error": error_str
                }

    async def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status"""
        health_checks = await self._check_system_health()
        
        # Add quota information for Gemini
        if "gemini" in health_checks:
            quota_status = await self.check_gemini_quota()
            health_checks["gemini"]["quota_status"] = quota_status
        
        return {
            "initialized": self._initialized,
            "components": health_checks,
            "overall_status": "healthy" if all(
                check.get("status") == "healthy" for check in health_checks.values()
            ) else "unhealthy"
        }

    @staticmethod
    def _normalize_question(question: str) -> str:
        """Normalize and clean the input question."""
        try:
            normalized = (question or "").strip()
            normalized = re.sub(r"\s+", " ", normalized)

            # Ensure ending punctuation
            if not normalized.endswith(("?", "؟", ".")):
                # Arabic detection (very light heuristic)
                is_ar = any(ch in normalized for ch in "أبتثجحخدذرزسشصضطظعغفقكلمنهوي")
                normalized += "؟" if is_ar else "?"
            return normalized
        except Exception as e:
            logger.error(f"Question normalization failed: {e}")
            return question or ""

    @staticmethod
    def _format_response(
        answer: str,
        source: str,
        confidence: float,
        processing_steps: List[str],
        processing_time: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Format the final response."""
        return {
            "answer": answer,
            "confidence": float(confidence),
            "source": source,
            "processing_info": {
                "steps": processing_steps,
                "processing_time_seconds": round(processing_time, 3),
                "timestamp": datetime.now().isoformat(),
            },
            "metadata": metadata or {},
            "status": "success",
        }

    @staticmethod
    def _format_error(
        error_message: str,
        processing_steps: List[str],
        reason: str = "unknown_error",
    ) -> Dict[str, Any]:
        """Format error response."""
        return {
            "answer": None,
            "error": error_message,
            "confidence": 0.0,
            "source": "error",
            "processing_info": {
                "steps": processing_steps,
                "timestamp": datetime.now().isoformat(),
            },
            "status": "error",
            "reason": reason,
        }


# Global intelligent Q&A service instance
intelligent_qa_service = IntelligentQAService()
