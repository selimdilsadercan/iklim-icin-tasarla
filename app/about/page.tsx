'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, FileText, Shield, Users, Heart, Star, Envelope, Leaf, Lightning, Drop, Plant } from '@phosphor-icons/react';
import AppBar from '@/components/AppBar';
import Link from 'next/link';

export default function AboutPage() {
  const router = useRouter();

  const infoPages = [
    {
      title: 'Gizlilik Politikası', 
      description: 'Kişisel verilerinizin nasıl korunduğunu öğrenin',
      icon: Shield,
      href: '/privacy',
      color: 'bg-green-500'
    },
    {
      title: 'Geri Bildirim',
      description: 'Görüş ve önerilerinizi bizimle paylaşın',
      icon: Heart,
      href: '/feedback',
      color: 'bg-pink-500'
    }
  ];

  const assistants = [
    {
      name: 'Yaprak',
      title: 'Çevre Asistanı',
      icon: Leaf,
      color: 'bg-green-500',
      description: 'Çevre koruma ve sürdürülebilirlik konularında rehberlik'
    },
    {
      name: 'Robi',
      title: 'Enerji Asistanı',
      icon: Lightning,
      color: 'bg-yellow-500',
      description: 'Enerji tasarrufu ve yenilenebilir enerji konularında uzman'
    },
    {
      name: 'Buğday',
      title: 'Tarım Asistanı',
      icon: Plant,
      color: 'bg-amber-500',
      description: 'Sürdürülebilir tarım ve gıda güvenliği konularında danışmanlık'
    },
    {
      name: 'Damla',
      title: 'Su Asistanı',
      icon: Drop,
      color: 'bg-blue-500',
      description: 'Su tasarrufu ve su kaynaklarının korunması konularında rehberlik'
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
          <span className="font-medium">Geri</span>
        </button>

        {/* About Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Info size={24} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hakkımızda</h1>
              <p className="text-gray-500 text-sm">İklim İçin Tasarla</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* App Description */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Star size={20} className="text-green-600" />
                <span>Uygulama Hakkında</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                İklim İçin Tasarla, çocuklar için iklim dostu öğrenme platformudur. 
                4 uzman AI asistanımızla çevre koruma, sürdürülebilirlik, enerji tasarrufu ve 
                doğa dostu yaşam konularında rehberlik sağlıyoruz.
              </p>
            </section>

            {/* AI Assistants */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Users size={20} className="text-green-600" />
                <span>Uzman Asistanlarımız</span>
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
                <span>Özellikler</span>
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">AI Destekli Öğrenme</h3>
                  <p className="text-gray-600 text-sm">
                    4 uzman asistanla gerçek zamanlı sohbet ve öğrenme deneyimi.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Çok Dilli Destek</h3>
                  <p className="text-gray-600 text-sm">
                    Türkçe, İngilizce, Fransızca ve İspanyolca dil desteği.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">İlerleme Takibi</h3>
                  <p className="text-gray-600 text-sm">
                    Konuşma geçmişi ve öğrenme istatistiklerinizi takip edin.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Güvenli Platform</h3>
                  <p className="text-gray-600 text-sm">
                    Reklamsız, gizlilik odaklı ve çocuk dostu güvenli ortam.
                  </p>
                </div>
              </div>
            </section>

            {/* Mission */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Heart size={20} className="text-green-600" />
                <span>Misyonumuz</span>
              </h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium">
                  İklim değişikliğiyle mücadele etmek için bilinçli nesiller yetiştirmek.
                </p>
                <p className="text-green-600 text-sm mt-2">
                  Çocukların çevre dostu yaşam konusunda bilinçlenmesine yardımcı olarak, 
                  sürdürülebilir bir gelecek için ilk adımları atmalarını sağlıyoruz.
                </p>
              </div>
            </section>

            {/* Developer Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Envelope size={20} className="text-green-600" />
                <span>İletişim</span>
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Görüş ve önerilerinizi bizimle paylaşın
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  E-posta: selimdilsadercan@gmail.com
                </p>
              </div>
            </section>

            {/* Information Pages */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FileText size={20} className="text-green-600" />
                <span>Yasal ve Bilgilendirme Sayfaları</span>
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
                <h3 className="font-medium text-gray-800 mb-2">Uygulama Versiyonu</h3>
                <p className="text-gray-600 text-sm">v1.0.0</p>
                <p className="text-gray-500 text-xs mt-1">
                  Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
