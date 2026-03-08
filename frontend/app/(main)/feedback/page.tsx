'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChatCircle, Star, Bug, Lightbulb, Heart, PaperPlaneTilt, User, DeviceMobile } from '@phosphor-icons/react';
import AppBar from '@/components/AppBar';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const feedbackTypes = [
    { id: 'feature', label: 'Yeni Özellik Öner', icon: DeviceMobile, description: 'Yeni özellik önerisi' },
    { id: 'bug', label: 'Sorun/Hata Bildir', icon: Bug, description: 'Hata bildirimi' },
    { id: 'account', label: 'Hesabım', icon: User, description: 'Hesap ile ilgili sorunlar' },
    { id: 'general', label: 'Başka bir şey', icon: ChatCircle, description: 'Diğer konular' }
  ];

  const handleTypeSelection = (type: string) => {
    setFeedbackType(type);
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically send the feedback to your backend
      console.log('Feedback submitted:', {
        type: feedbackType,
        rating,
        message,
        email,
        timestamp: new Date().toISOString()
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 mb-6"
          >
            <ArrowLeft size={20} weight="regular" />
            <span className="font-medium">Geri</span>
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Teşekkürler!</h2>
            <p className="text-gray-600 mb-6">
              Geri bildiriminiz başarıyla gönderildi. Değerli görüşleriniz uygulamayı geliştirmemize yardımcı olacak.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
            >
              Profile Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={20} weight="regular" />
          <span className="font-medium">Geri</span>
        </button>

        {/* Feedback Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ChatCircle size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Geri Bildirim Gönder</h1>
              <p className="text-gray-500 text-sm">Görüşleriniz bizim için değerli</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Geri Bildirim Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFeedbackType(type.id)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        feedbackType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={24} className={`mx-auto mb-2 ${
                        feedbackType === type.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="text-sm font-medium text-gray-800">{type.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Genel Değerlendirme
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={32}
                      weight={star <= rating ? 'fill' : 'regular'}
                      className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {rating === 0 && 'Değerlendirme seçin'}
                {rating === 1 && 'Çok kötü'}
                {rating === 2 && 'Kötü'}
                {rating === 3 && 'Orta'}
                {rating === 4 && 'İyi'}
                {rating === 5 && 'Mükemmel'}
              </p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Mesajınız *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Geri bildiriminizi buraya yazın..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {message.length}/500 karakter
              </p>
            </div>

            {/* Email (Optional) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta (İsteğe bağlı)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Yanıt almak istiyorsanız e-posta adresinizi girin"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                E-posta adresinizi verirseniz, geri bildiriminize yanıt verebiliriz.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={16} weight="regular" />
                  <span>Geri Bildirim Gönder</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

{/* Bottom Navigation */}
<AppBar currentPage="profile" />
