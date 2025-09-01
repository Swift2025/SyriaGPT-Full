// src/app/[lang]/components/ClientLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';

// نستقبل الترجمة كـ prop
export default function ClientLayout({
  children,
  dictionary,
}: {
  children: React.ReactNode;
  dictionary: any; // القاموس الذي تم تمريره
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: 'font-arabic border border-black/10 dark:border-white/10',
          style: { borderRadius: '10px', background: '#3d3a3b', color: '#D9D9D9' },
          success: { duration: 3000, iconTheme: { primary: '#428177', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />

      {/* شاشة التحميل مع نصوص مترجمة */}
      <div id="initial-loader" className="fixed inset-0 bg-brand-cream dark:bg-brand-navy-dark z-[100] flex items-center justify-center transition-opacity duration-300">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 animate-pulse">
            <img src="/images/logo.ai.svg" alt="Syrian Eagle Logo" className="w-full h-full" />
          </div>
          <h2 className="text-xl font-semibold text-brand-gold-primary mb-2">{dictionary.loader.title}</h2>
          <p className="text-sm text-brand-text-gray dark:text-gray-400">{dictionary.loader.loading}</p>
        </div>
      </div>

      <main id="app-content" className="opacity-0 transition-opacity duration-300">
        <div className="flex h-screen bg-brand-cream dark:bg-brand-navy-dark">
          <Sidebar
            dictionary={dictionary} // مرر القاموس إلى الشريط الجانبي أيضاً
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          
          <div className="flex-1 overflow-y-auto">
            {React.isValidElement(children) 
              ? React.cloneElement(children as React.ReactElement<any>, { toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) }) 
              : children
            }
          </div>
        </div>
      </main>

      {/* يمكنك ترك السكربت هنا أو نقله إلى useEffect */}
      <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function showContent() {
                  const loader = document.getElementById('initial-loader');
                  const content = document.getElementById('app-content');
                  if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => { loader.style.display = 'none'; }, 300);
                  }
                  if (content) {
                    content.style.opacity = '1';
                  }
                }
                if (document.readyState === 'loading') {
                  window.addEventListener('load', showContent);
                } else {
                  showContent();
                }
              })();
            `
          }}
        />
    </>
  );
}