// src/app/[lang]/profile/ProfilePageClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { User, Mail, Key, Star, Trash2, Edit3, Save, X, AlertTriangle, Camera, Shield, Crown, Calendar, Settings, Bell } from 'lucide-react';

// مكون شعار النسر السوري
const SyrianEagle: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <img src="/images/logo.ai.svg" alt="Syrian Eagle Logo" className="w-full h-full drop-shadow-lg" />
  </div>
);

// مكون البطاقة المحسنة
const ProfileCard: React.FC<{ 
  title: string; 
  description: string; 
  children: React.ReactNode; 
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  gradient?: string;
  isDangerous?: boolean;
}> = ({ title, description, children, footer, icon, gradient = "from-white to-gray-50 dark:from-gray-800 dark:to-gray-700", isDangerous = false }) => (
  <div className={`
    relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 
    bg-gradient-to-br ${gradient} 
    border ${isDangerous ? 'border-red-200 dark:border-red-700/30' : 'border-amber-200/50 dark:border-amber-700/30'}
    backdrop-blur-sm
  `}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                    transform -translate-x-full group-hover:translate-x-full 
                    transition-transform duration-1000 pointer-events-none"></div>
    <div className="relative p-8">
      <div className="flex items-start gap-4 mb-6">
        {icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
            isDangerous ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-green-500'
          }`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
      {footer && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          {footer}
        </div>
      )}
    </div>
  </div>
);

// مكون حقل الإدخال المحسن
const InputField: React.FC<{
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, type, value, onChange, placeholder, icon, required = false, disabled = false }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
      {icon && <span className="text-amber-600 dark:text-amber-400">{icon}</span>}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-green-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-4 rounded-xl border-2 transition-all duration-300
            bg-white dark:bg-gray-700 backdrop-blur-sm
            text-gray-800 dark:text-gray-200 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
            border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
    </div>
  </div>
);

// مكون الصورة الشخصية
const ProfileAvatar: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onEdit?: () => void;
}> = ({ src, alt, size = 'lg', editable = false, onEdit }) => {
  const sizeClasses = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };
  return (
    <div className="relative group">
      <div className={`
        ${sizeClasses[size]} rounded-full overflow-hidden 
        border-4 border-gradient-to-r from-amber-400 to-green-500 
        shadow-xl hover:shadow-2xl transition-all duration-300
        group-hover:scale-105
      `}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
      {editable && (
        <button
          onClick={onEdit}
          className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-amber-500 to-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:from-amber-600 hover:to-green-600 transition-all duration-300 transform translate-x-1 translate-y-1 hover:scale-110"
        >
          <Camera size={16} />
        </button>
      )}
    </div>
  );
};

// Modal تأكيد الحذف
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  dictionary: any;
}> = ({ isOpen, onClose, onConfirm, title, message, dictionary }) => {
  if (!isOpen) return null;
  const t = dictionary.profilePage.deleteModal;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-red-200 dark:border-red-700/30 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{message}</p>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
              {t.cancelButton}
            </button>
            <button onClick={onConfirm} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95">
              {t.confirmButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePageClient({ dictionary }: { dictionary: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({ 
    name: 'أحمد الشامي', 
    email: 'ahmed@syriagpt.com', 
    avatar: '/images/default-avatar.png',
    joinDate: '15 يناير 2024',
    plan: dictionary.profilePage.sidebar.freePlan
  });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const params = useParams();
  const lang = params.lang as string;
  const t = dictionary.profilePage;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert(t.security.passwordMismatch);
      return;
    }
    alert(t.security.updateSuccess);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t.personalInfo.updateSuccess);
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    alert(t.deleteModal.deleteSuccess);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-amber-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 font-arabic min-h-screen">
      
      <div className="fixed inset-0 opacity-30 dark:opacity-10 -z-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">
        
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <SyrianEagle className="w-16 h-16 animate-float" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-800 via-green-700 to-amber-900 bg-clip-text text-transparent mb-6">
            {t.header.title}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t.header.description}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 dark:border-amber-700/30 text-center">
                <ProfileAvatar
                  src={userData.avatar}
                  alt={t.sidebar.avatarAlt}
                  size="lg"
                  editable={true}
                  onEdit={() => alert(t.sidebar.changeAvatar)}
                />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-2">{userData.name}</h2>
                <p className="text-amber-600 dark:text-amber-400 font-medium mb-6">{userData.email}</p>
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-900/20 dark:to-green-900/20 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2"><Calendar size={16} className="text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{t.sidebar.joinDate}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{userData.joinDate}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2"><Crown size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{t.sidebar.currentPlan}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{userData.plan}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center"><div className="text-2xl font-bold text-amber-600 dark:text-amber-400">142</div><div className="text-xs text-gray-500 dark:text-gray-400">{t.sidebar.conversations}</div></div>
                  <div className="text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-400">28</div><div className="text-xs text-gray-500 dark:text-gray-400">{t.sidebar.activeDays}</div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <ProfileCard title={t.personalInfo.title} description={t.personalInfo.description} icon={<User size={24} />} footer={
              isEditing ? (
                <div className="flex gap-3">
                  <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"><X size={16} />{t.personalInfo.cancelButton}</button>
                  <button type="submit" form="profileForm" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-green-500 text-white rounded-xl hover:from-amber-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 active:scale-95"><Save size={16} />{t.personalInfo.saveButton}</button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-green-500 text-white rounded-xl hover:from-amber-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 active:scale-95"><Edit3 size={16} />{t.personalInfo.editButton}</button>
              )
            }>
              <form onSubmit={handleProfileUpdate} id="profileForm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>{isEditing ? <InputField label={t.personalInfo.fullName} type="text" value={userData.name} onChange={(value) => setUserData({...userData, name: value})} icon={<User size={16} />} required /> : <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"><User size={16} className="text-amber-600 dark:text-amber-400" />{t.personalInfo.fullName}</label><p className="text-lg text-gray-800 dark:text-gray-200">{userData.name}</p></div>}</div>
                  <div>{isEditing ? <InputField label={t.personalInfo.email} type="email" value={userData.email} onChange={(value) => setUserData({...userData, email: value})} icon={<Mail size={16} />} required /> : <div className="space-y-2"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"><Mail size={16} className="text-amber-600 dark:text-amber-400" />{t.personalInfo.email}</label><p className="text-lg text-gray-800 dark:text-gray-200">{userData.email}</p></div>}</div>
                </div>
              </form>
            </ProfileCard>

            <ProfileCard title={t.security.title} description={t.security.description} icon={<Shield size={24} />}>
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-6">
                  <InputField label={t.security.currentPassword} type="password" value={passwordData.current} onChange={(value) => setPasswordData({...passwordData, current: value})} placeholder={t.security.currentPasswordPlaceholder} icon={<Key size={16} />} required />
                  <InputField label={t.security.newPassword} type="password" value={passwordData.new} onChange={(value) => setPasswordData({...passwordData, new: value})} placeholder={t.security.newPasswordPlaceholder} icon={<Key size={16} />} required />
                  <InputField label={t.security.confirmNewPassword} type="password" value={passwordData.confirm} onChange={(value) => setPasswordData({...passwordData, confirm: value})} placeholder={t.security.confirmNewPasswordPlaceholder} icon={<Key size={16} />} required />
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95"><Shield size={16} />{t.security.updateButton}</button>
                </div>
              </form>
            </ProfileCard>

            <ProfileCard title={t.subscription.title} description={t.subscription.description} icon={<Crown size={24} />} gradient="from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl text-white">
                <div><h4 className="text-xl font-bold mb-2">{t.subscription.upgradeTitle}</h4><p className="text-purple-100">{t.subscription.upgradeDescription}</p></div>
                <Link href={`/${lang}/upgrade`}><button className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95">{t.subscription.upgradeButton}</button></Link>
              </div>
            </ProfileCard>

            <ProfileCard title={t.dangerZone.title} description={t.dangerZone.description} icon={<AlertTriangle size={24} />} gradient="from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20" isDangerous={true}>
              <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-700/30">
                <div className="flex items-center justify-between">
                  <div><h4 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">{t.dangerZone.deleteTitle}</h4><p className="text-red-600 dark:text-red-400">{t.dangerZone.deleteDescription}</p></div>
                  <button onClick={() => setIsDeleteModalOpen(true)} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"><Trash2 size={16} />{t.dangerZone.deleteButton}</button>
                </div>
              </div>
            </ProfileCard>
          </div>
        </div>
      </div>

      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAccount} title={t.deleteModal.title} message={t.deleteModal.message} dictionary={dictionary} />

      <style jsx>{`
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </main>
  );
}