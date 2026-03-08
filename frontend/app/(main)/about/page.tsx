'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, FileText, Shield, Users, Heart, Star, Envelope, Leaf, Lightning, Drop, Plant } from '@phosphor-icons/react';
import AppBar from '@/components/AppBar';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

export default function AboutPage() {
  const router = useRouter();
  const t = useTranslations('about');

  const infoPages = [
    {
      title: t('privacyPolicy'), 
      description: t('privacyPolicyDescription'),
      icon: Shield,
      href: '/privacy',
      color: 'bg-green-500'
    },
    {
      title: t('feedback'),
      description: t('feedbackDescription'),
      icon: Heart,
      href: '/feedback',
      color: 'bg-pink-500'
    }
  ];

  const assistants = [
    {
      name: t('assistants.yaprak.name'),
      title: t('assistants.yaprak.title'),
      icon: Leaf,
      color: 'bg-green-500',
      description: t('assistants.yaprak.description')
    },
    {
      name: t('assistants.robi.name'),
      title: t('assistants.robi.title'),
      icon: Lightning,
      color: 'bg-yellow-500',
      description: t('assistants.robi.description')
    },
    {
      name: t('assistants.bugday.name'),
      title: t('assistants.bugday.title'),
      icon: Plant,
      color: 'bg-amber-500',
      description: t('assistants.bugday.description')
    },
    {
      name: t('assistants.damla.name'),
      title: t('assistants.damla.title'),
      icon: Drop,
      color: 'bg-blue-500',
      description: t('assistants.damla.description')
    }
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 mb-6"
        >
          <ArrowLeft size={20} weight="regular" />
          <span className="font-medium">{t('back')}</span>
        </button>

        {/* About Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Info size={24} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
              <p className="text-gray-500 text-sm">{t('subtitle')}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* App Description */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Star size={20} className="text-green-600" />
                <span>{t('appAbout')}</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('appDescription')}
              </p>
            </section>

            {/* AI Assistants */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Users size={20} className="text-green-600" />
                <span>{t('expertAssistants')}</span>
              </h2>
              <div className="space-y-3">
                {assistants.map((assistant, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 ${assistant.color} rounded-lg flex items-center justify-center`}>
                        <assistant.icon size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{assistant.name}</h3>
                        <p className="text-sm text-gray-600">{assistant.title}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{assistant.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Features */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Star size={20} className="text-green-600" />
                <span>{t('features')}</span>
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">{t('aiLearning')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('aiLearningDescription')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">{t('multilingualSupport')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('multilingualSupportDescription')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">{t('progressTracking')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('progressTrackingDescription')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">{t('securePlatform')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('securePlatformDescription')}
                  </p>
                </div>
              </div>
            </section>

            {/* Mission */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Heart size={20} className="text-green-600" />
                <span>{t('mission')}</span>
              </h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium">
                  {t('missionTitle')}
                </p>
                <p className="text-green-600 text-sm mt-2">
                  {t('missionDescription')}
                </p>
              </div>
            </section>

            {/* Developer Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Envelope size={20} className="text-green-600" />
                <span>{t('contact')}</span>
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">
                  {t('contactTitle')}
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  {t('contactEmail')}
                </p>
              </div>
            </section>

            {/* Information Pages */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FileText size={20} className="text-green-600" />
                <span>{t('legalPages')}</span>
              </h2>
              <div className="space-y-3">
                {infoPages.map((page, index) => (
                  <Link
                    key={index}
                    href={page.href}
                    className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${page.color} rounded-lg flex items-center justify-center`}>
                        <page.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{page.title}</h3>
                        <p className="text-sm text-gray-600">{page.description}</p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Version Info */}
            <section>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">{t('appVersion')}</h3>
                <p className="text-gray-600 text-sm">v1.0.0</p>
                <p className="text-gray-500 text-xs mt-1">
                  {t('lastUpdate')}: {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
