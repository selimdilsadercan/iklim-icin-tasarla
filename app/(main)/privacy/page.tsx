'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, FileText, User } from '@phosphor-icons/react';
import AppBar from '@/components/AppBar';

export default function PrivacyPolicyPage() {
  const router = useRouter();

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

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield size={24} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gizlilik Politikası</h1>
              <p className="text-gray-500 text-sm">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <FileText size={20} className="text-green-600" />
                <span>Uygulama ve Geliştirici</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                İklim İçin Tasarla ("Uygulama"), geliştirici tarafından yayınlanır. 
                Kullanıcılarımızın gizliliğini korumak bizim için çok önemlidir. 
                Bu gizlilik politikası, kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mt-3">
                <p className="text-green-800 font-medium">İletişim: selimdilsadercan@gmail.com</p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Database size={20} className="text-green-600" />
                <span>Toplanan Veriler ve Amaçlar</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Hesap Bilgileri</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Ad ve soyad (kimlik doğrulama, destek)</li>
                    <li>• E-posta adresi (kimlik doğrulama, destek)</li>
                    <li>• Profil fotoğrafı (isteğe bağlı, uygulama işlevselliği)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Uygulama Verileri</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Tasarım projeleri ve çalışmaları (uygulama işlevselliği)</li>
                    <li>• İklim değişikliği ile ilgili notlar ve fikirler (uygulama işlevselliği)</li>
                    <li>• Kullanıcı tercihleri ve ayarları (uygulama işlevselliği)</li>
                    <li>• Kullanım metrikleri (ürün iyileştirme, analiz)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Cihaz Bilgileri</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Cihaz ID (güvenlik, hata ayıklama)</li>
                    <li>• Uygulama versiyonu (destek, hata ayıklama)</li>
                    <li>• İşletim sistemi bilgisi (uyumluluk, destek)</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 font-medium text-sm">
                    <strong>Önemli:</strong> Reklam amacıyla veri toplanmaz ve üçüncü taraflarla paylaşılmaz.
                  </p>
                </div>
              </div>
            </section>

            {/* Third Party Sharing */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Users size={20} className="text-green-600" />
                <span>Üçüncü Taraflar ve SDK'lar</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Kullanılan SDK'lar</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• <strong>Supabase</strong> - kimlik doğrulama ve veri saklama</li>
                    <li>• <strong>Next.js</strong> - web uygulaması framework'ü</li>
                    <li>• <strong>Capacitor</strong> - mobil uygulama geliştirme</li>
                    <li>• <strong>Tailwind CSS</strong> - kullanıcı arayüzü</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 font-medium text-sm">
                    <strong>Önemli:</strong> Bu sağlayıcılarla veri satışı yapmayız; sözleşmelerimiz veri işleyen statüsündedir.
                  </p>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Kişisel bilgilerinizi üçüncü taraflarla paylaşmayız, ancak aşağıdaki durumlar hariç:
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Yasal zorunluluklar</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Kullanıcının açık rızası</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Hizmet sağlayıcıları (sınırlı erişim ile)</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Database size={20} className="text-green-600" />
                <span>Veri Saklama</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Saklama Süreleri</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• <strong>Tasarım projeleri ve çalışmaları:</strong> 24 ay saklanır</li>
                    <li>• <strong>Hesap bilgileri:</strong> Hesap aktif olduğu sürece</li>
                    <li>• <strong>Günlükler ve hata kayıtları:</strong> 30 gün</li>
                    <li>• <strong>Analitik veriler:</strong> 12 ay</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 font-medium text-sm">
                    <strong>Hesap Silme:</strong> Hesap silindiğinde tüm veriler 7 gün içinde kalıcı olarak kaldırılır.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Lock size={20} className="text-green-600" />
                <span>Veri Güvenliği</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel bilgilerinizi korumak için aşağıdaki güvenlik önlemlerini alırız:
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>SSL/TLS şifreleme ile veri iletimi</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Erişimler yetki bazlıdır</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Düzenli güvenlik güncellemeleri uygulanır</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Güvenli Supabase altyapısı kullanılır</span>
                </li>
              </ul>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <User size={20} className="text-green-600" />
                <span>Kullanıcı Hakları</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Haklarınız</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Kişisel verilerinize erişim hakkı</li>
                    <li>• Verilerinizi düzeltme hakkı</li>
                    <li>• Verilerinizi silme hakkı</li>
                    <li>• Veri işlemeye itiraz etme hakkı</li>
                    <li>• Veri taşınabilirliği hakkı</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Nasıl Kullanabilirsiniz?</h3>
                  <ul className="text-green-700 space-y-1 text-sm">
                    <li>• <strong>E-posta:</strong> selimdilsadercan@gmail.com adresinden talep oluşturun</li>
                    <li>• <strong>Uygulama içi:</strong> Profil → Ayarlar → Gizlilik bölümünden</li>
                    <li>• <strong>Web:</strong> https://iklim-icin-tasarla.com/privacy adresinden</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Account Deletion */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Shield size={20} className="text-green-600" />
                <span>Hesap ve Veri Silme</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Uygulama İçi Silme</h3>
                  <p className="text-gray-600 text-sm mb-2">Profil → Hesabı Sil</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Web Üzerinden Silme</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Uygulama yüklü değilken: <a href="https://iklim-icin-tasarla.com/delete" className="text-green-600 hover:underline">https://iklim-icin-tasarla.com/delete</a> adresinden talep oluşturabilirsiniz.
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800 font-medium text-sm">
                    <strong>Önemli:</strong> Hesap silindiğinde tüm verileriniz 7 gün içinde kalıcı olarak kaldırılır ve geri alınamaz.
                  </p>
                </div>
              </div>
            </section>

            {/* Children Policy */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <User size={20} className="text-green-600" />
                <span>Çocuklara Yönelik Olmama Beyanı</span>
              </h2>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium text-sm">
                  <strong>Önemli:</strong> Uygulama 13 yaş altını hedeflemez ve Google Play Families programına dahil değildir. 
                  13 yaş altındaki çocuklardan bilerek veri toplamayız.
                </p>
              </div>
            </section>

            {/* Ads and Permissions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Eye size={20} className="text-green-600" />
                <span>Reklamlar ve İzinler</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Reklamlar</h3>
                  <p className="text-gray-600 text-sm">
                    Uygulamamızda reklam gösterilmez ve reklam amacıyla veri toplanmaz.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Kullanılan İzinler</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• <strong>İnternet:</strong> Uygulama işlevselliği için gerekli</li>
                    <li>• <strong>Depolama:</strong> Tasarım verilerini kaydetmek için</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-green-50 p-4 rounded-lg mt-3">
                <p className="text-green-800 font-medium">E-posta: selimdilsadercan@gmail.com</p>
                <p className="text-green-600 text-sm mt-1">
                  Gizlilik politikamız değişiklik gösterebilir. Önemli değişiklikler uygulama içi bildirimle duyurulur.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
