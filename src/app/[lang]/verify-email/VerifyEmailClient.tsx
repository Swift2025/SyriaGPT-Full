// src/app/[lang]/verify-email/VerifyEmailClient.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { CheckCircle, XCircle, RefreshCw, ArrowLeft, Shield, Clock, AlertCircle, Send } from 'lucide-react';

// مكون النسر السوري
const SyrianEagle: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <div className={`${className} flex items-center justify-center rounded-full bg-brand-cream dark:bg-brand-navy-dark p-1`}>
    <img src="/images/logo.ai.svg" alt="Syrian Eagle Logo" className="w-full h-full" />
  </div>
);

export default function VerifyEmailClient({ dictionary }: { dictionary: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const lang = params.lang as string;
  const email = searchParams?.get('email') || 'user@example.com';
  const token = searchParams?.get('token');
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const t = dictionary.verifyEmailPage;

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && verificationCode.every(digit => digit)) {
      handleVerification();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = [...verificationCode];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setVerificationCode(newCode);
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setErrorMessage(t.errors.incompleteCode);
      return;
    }
    setIsVerifying(true);
    setErrorMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (code === '123456') {
        setVerificationStatus('success');
        setTimeout(() => {
          router.push(`/${lang}/dashboard`); // Adjust dashboard route if needed
        }, 2000);
      } else {
        setVerificationStatus('error');
        setErrorMessage(t.errors.invalidCode);
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage(t.errors.generic);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    setVerificationCode(['', '', '', '', '', '']);
    setVerificationStatus('idle');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResendCooldown(60);
      alert(t.alerts.resendSuccess);
    } catch (error) {
      setErrorMessage(t.errors.resendFailed);
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (token) {
      console.log('Token detected:', token);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D9D9D9] to-gray-200 dark:from-[#002326] dark:to-[#054239] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#428177]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#B9A779]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="inline-block"><SyrianEagle className="w-20 h-20 mx-auto mb-4" /></Link>
          <h1 className="text-3xl font-bold text-[#054239] dark:text-[#B9A779] mb-2">{t.header.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{t.header.description}</p>
          <p className="text-[#428177] dark:text-[#B9A779] font-medium mt-1" dir="ltr">{email}</p>
        </div>

        <div className="bg-white/90 dark:bg-[#161616]/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
          {verificationStatus === 'idle' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">{t.form.label}</label>
                <div className="flex gap-2 justify-center" dir="ltr">
                  {verificationCode.map((digit, index) => (
                    <input key={index} ref={el => inputRefs.current[index] = el} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleInputChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} onPaste={index === 0 ? handlePaste : undefined} className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg transition-all ${digit ? 'border-[#428177] bg-[#428177]/5' : 'border-gray-300 dark:border-gray-600'} focus:border-[#428177] focus:ring-2 focus:ring-[#428177]/20 focus:outline-none dark:bg-[#054239]/20 dark:text-white ${errorMessage ? 'border-red-500 animate-shake' : ''}`} disabled={isVerifying} />
                  ))}
                </div>
              </div>
              {errorMessage && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p></div>}
              <button onClick={handleVerification} disabled={isVerifying || !verificationCode.every(digit => digit)} className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${verificationCode.every(digit => digit) ? 'bg-gradient-to-r from-[#428177] to-[#054239] text-white hover:shadow-lg hover:scale-[1.02]' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                {isVerifying ? (<><RefreshCw className="w-5 h-5 animate-spin" />{t.form.verifyingButton}</>) : (<><Shield className="w-5 h-5" />{t.form.verifyButton}</>)}
              </button>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t.form.resend.question}</p>
                <button onClick={handleResend} disabled={resendCooldown > 0 || isResending} className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#428177] hover:text-[#054239] dark:text-[#B9A779] dark:hover:text-[#B9A779]/80'}`}>
                  {isResending ? (<><RefreshCw className="w-4 h-4 animate-spin" />{t.form.resend.resendingButton}</>) : resendCooldown > 0 ? (<><Clock className="w-4 h-4" />{t.form.resend.cooldown.replace('{seconds}', resendCooldown.toString())}</>) : (<><Send className="w-4 h-4" />{t.form.resend.resendButton}</>)}
                </button>
              </div>
            </>
          )}
          {verificationStatus === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow"><CheckCircle className="w-12 h-12 text-green-500" /></div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.status.success.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t.status.success.description}</p>
              <div className="flex items-center justify-center gap-2 text-[#428177] dark:text-[#B9A779]"><RefreshCw className="w-4 h-4 animate-spin" /><span className="text-sm">{t.status.success.redirecting}</span></div>
            </div>
          )}
          {verificationStatus === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle className="w-12 h-12 text-red-500" /></div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.status.error.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage || t.errors.generic}</p>
              <button onClick={() => { setVerificationStatus('idle'); setVerificationCode(['', '', '', '', '', '']); setErrorMessage(''); inputRefs.current[0]?.focus(); }} className="px-6 py-2 bg-[#428177] text-white rounded-lg hover:bg-[#054239] transition-colors">{t.status.error.tryAgainButton}</button>
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${lang}/login`} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#428177] dark:hover:text-[#B9A779] transition-colors"><ArrowLeft className="w-4 h-4" />{t.backToLogin}</Link>
        </div>
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">{t.securityNote.title}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">{t.securityNote.points.map((point: string, i: number) => <li key={i}>{point}</li>)}</ul>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); } 20%, 40%, 60%, 80% { transform: translateX(2px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};