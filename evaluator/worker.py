# -*- coding: utf-8 -*-
import os
import time
import requests
import json
import re
import anthropic
from collections import defaultdict
from dotenv import load_dotenv
from engine.feature_extractor import FeatureExtractor
from engine.scorer import Scorer
from utils.data_handler import DataHandler
from tqdm import tqdm

load_dotenv()

# Configuration
BACKEND_URL = os.environ.get("BACKEND_URL", "https://staging-iklim-bu6i.encr.app")
IDLE_TIMEOUT = int(os.environ.get("WORKER_IDLE_TIMEOUT", "120"))  # saniye (varsayılan 2 dakika)
POLL_INTERVAL = 15  # saniye

DIALOG_TO_NUM = {"A": 0, "B": 1, "C": 2, "D": 3}
NUM_TO_DIALOG = {v: k for k, v in DIALOG_TO_NUM.items()}


def compute_student_stats(scored_messages: list) -> dict:
    """Bir öğrencinin puanlanmış mesajlarından istatistikleri hesaplar."""
    n = len(scored_messages)
    if n == 0:
        return {}

    content_scores = [m["content_score"] for m in scored_messages]
    dialog_nums = [DIALOG_TO_NUM.get(str(m["dialog_score"]), 0) for m in scored_messages]

    avg_content = sum(content_scores) / n
    avg_dialog_num = sum(dialog_nums) / n
    avg_dialog_cat = NUM_TO_DIALOG[int(round(avg_dialog_num))]

    # Gelişim trendi
    if n >= 4:
        first_score = sum(content_scores[:2]) / 2
        last_score = sum(content_scores[-2:]) / 2
    elif n >= 2:
        first_score = content_scores[0]
        last_score = content_scores[-1]
    else:
        first_score = last_score = content_scores[0]

    if last_score > first_score + 0.5:
        trend = "Yükselen (Öğrenme Gerçekleşiyor)"
    elif last_score < first_score - 0.5:
        trend = "Düşen (Odak Kaybı veya Zorlanma)"
    else:
        trend = "Stabil (Seviye Korunuyor)"

    # Dağılımlar
    content_dist = {}
    for s in content_scores:
        k = str(int(s))
        content_dist[k] = content_dist.get(k, 0) + 1

    dialog_dist = {}
    for m in scored_messages:
        d = str(m["dialog_score"])
        dialog_dist[d] = dialog_dist.get(d, 0) + 1

    # Genel puan (1-10)
    content_norm = avg_content / 3.0
    dialog_norm = avg_dialog_num / 3.0
    overall_score = max(1.0, min(10.0, round((content_norm * 0.6 + dialog_norm * 0.4) * 10, 1)))

    return {
        "overall_score": overall_score,
        "avg_content_score": round(avg_content, 2),
        "avg_dialog_level_numeric": round(avg_dialog_num, 2),
        "avg_dialog_level_category": avg_dialog_cat,
        "trend": trend,
        "content_score_distribution": content_dist,
        "dialog_level_distribution": dialog_dist,
        "message_count": n,
    }


def generate_student_summary(student_name: str, scored_messages: list, stats: dict) -> dict:
    """LLM ile öğrenci için kalitatif özet oluşturur."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {"engagement_level": "Bilinmiyor", "summary_paragraph": "API key bulunamadı."}

    # Mesaj bloğu oluştur
    msg_lines = []
    for i, m in enumerate(scored_messages):
        text = m["message"][:160]
        c = m["content_score"]
        d = m["dialog_score"]
        reason = (m.get("content_reasoning") or "")[:90]
        msg_lines.append(f'{i+1}. [C:{c} D:{d}] "{text}"\n   ↳ {reason}')

    messages_block = "\n\n".join(msg_lines)

    stats_block = (
        f"Ort. içerik: {stats.get('avg_content_score','?')}/3 | "
        f"Ort. diyalog: {stats.get('avg_dialog_level_category','?')} | "
        f"Trend: {stats.get('trend','?')}"
    )

    prompt = f"""Sen bir eğitim uzmanısın. Bir ortaokul öğrencisinin iklim/çevre chatbotuyla yaptığı konuşmanın etiketli verisi aşağıda yer alıyor.

SKORLAMA KILAVUZU:
• İçerik (C) 0-3: 0=konu dışı | 1=temel kavram | 2=ileri kavram | 3=çoklu kavram+bağlantı
• Diyalog (D) A-D: A=minimal | B=basit soru | C=diyalogu ilerletici | D=akıl yürütme var

ÖĞRENCİ: {student_name}
İSTATİSTİKLER: {stats_block}

ÖĞRENCİ MESAJLARI:
{messages_block}

Yukarıdaki etiketli veriyi ve istatistikleri kullanarak bu öğrenci için bir değerlendirme raporu oluştur.

CEVAP FORMATI (sadece geçerli JSON — başka hiçbir şey yazma):
{{
  "engagement_level": "<Düşük | Orta | Yüksek>",
  "conversation_themes": ["<tema1>", "<tema2>", "<tema3>"],
  "most_interested_topic": "<öğrencinin en çok ilgi duyduğu tek konu>",
  "summary_paragraph": "<öğrencinin konuşmalarını, kavrama düzeyini ve katılım biçimini özetleyen 2-3 cümlelik Türkçe paragraf>"
}}"""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        model = os.environ.get("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
        response = client.messages.create(
            model=model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        print(f"  ⚠ Özet LLM hatası: {str(e)}")

    return {"engagement_level": "Bilinmiyor", "summary_paragraph": "Özet oluşturulamadı."}


def run_worker_loop():
    print(f"🔄 Worker döngüsü başlatıldı. Backend: {BACKEND_URL}")
    print(f"⏱️  Boşta kalma zaman aşımı: {IDLE_TIMEOUT} saniye")
    
    # Bileşenleri yükle
    basic, advanced = DataHandler.load_knowledge_components()
    extractor = FeatureExtractor(basic_terms=basic, advanced_terms=advanced)
    scorer = Scorer()
    
    idle_since = time.time()
    
    while True:
        try:
            # Boşta kalma kontrolü
            idle_duration = time.time() - idle_since
            if idle_duration >= IDLE_TIMEOUT:
                print(f"😴 {IDLE_TIMEOUT} saniyedir iş bulunamadı. Worker kapanıyor.")
                break
            
            # 1. İş Claim Et
            print(f"🔍 Bekleyen iş taranıyor... (boşta: {int(idle_duration)}s / {IDLE_TIMEOUT}s)")
            response = requests.post(f"{BACKEND_URL}/batch/jobs/claim", timeout=10)
            response.raise_for_status()
            job_data = response.json().get("job")
            
            if not job_data:
                time.sleep(POLL_INTERVAL)
                continue
            
            # İş bulundu, idle sayacını sıfırla
            idle_since = time.time()
                
            job_id = job_data["id"]
            print(f"🚀 İş alındı: {job_id}")
            
            # 2. Mesajları Getir
            msg_response = requests.get(f"{BACKEND_URL}/batch/jobs/{job_id}/messages", timeout=30)
            msg_response.raise_for_status()
            messages = msg_response.json().get("messages", [])
            
            print(f"📩 {len(messages)} mesaj bulundu. Analiz başlıyor...")
            
            # 3. Mesajları Analiz Et ve Gönder
            student_messages = [m for m in messages if m["is_user"]]

            # Öğrenci bazlı sonuçları topla
            student_scored = defaultdict(list)
            
            for msg in tqdm(student_messages, desc=f"İş {job_id}"):
                features = extractor.extract_features(msg["message"])
                
                # İçerik Puanlama
                content_res = scorer.score_with_llm(msg["message"], features, "content")
                # Diyalog Puanlama
                dialog_res = scorer.score_with_llm(msg["message"], features, "dialog")
                
                # Sonucu backend'e gönder
                eval_payload = {
                    "messageId": msg["id"],
                    "jobId": job_id,
                    "scores": {
                        "content": content_res["score"],
                        "dialog": dialog_res["score"],
                        "content_reasoning": content_res.get("reasoning"),
                        "dialog_reasoning": dialog_res.get("reasoning"),
                        "features": features
                    },
                    "feedback": content_res.get("reasoning")
                }
                
                res = requests.post(f"{BACKEND_URL}/batch/evaluate", json=eval_payload, timeout=10)
                res.raise_for_status()

                # Öğrenci bazlı sonuçları biriktir
                student_scored[msg["user_id"]].append({
                    "message": msg["message"],
                    "display_name": msg.get("display_name", "Bilinmeyen"),
                    "content_score": content_res["score"],
                    "dialog_score": dialog_res["score"],
                    "content_reasoning": content_res.get("reasoning"),
                    "dialog_reasoning": dialog_res.get("reasoning"),
                })

            # ─── 4. Öğrenci Raporları Oluştur ───────────────────────────
            print(f"📊 {len(student_scored)} öğrenci için rapor oluşturuluyor...")

            for student_id, scored_msgs in student_scored.items():
                student_name = scored_msgs[0]["display_name"]
                print(f"  📝 Rapor: {student_name} ({len(scored_msgs)} mesaj)")

                # İstatistikleri hesapla
                stats = compute_student_stats(scored_msgs)

                # LLM ile kalitatif özet oluştur
                llm_eval = generate_student_summary(student_name, scored_msgs, stats)
                llm_eval["overall_score"] = stats.get("overall_score", 0)

                # Backend'e gönder
                report_payload = {
                    "jobId": job_id,
                    "studentId": student_id,
                    "studentName": student_name,
                    "overallScore": stats.get("overall_score", 0),
                    "stats": stats,
                    "llmEvaluation": llm_eval,
                }

                try:
                    rr = requests.post(f"{BACKEND_URL}/batch/student-report", json=report_payload, timeout=15)
                    rr.raise_for_status()
                    print(f"  ✅ Rapor kaydedildi: {student_name}")
                except Exception as re_err:
                    print(f"  ❌ Rapor kayıt hatası ({student_name}): {str(re_err)}")

            # ─── 5. İş Durumunu Tamamlandı Yap ──────────────────────────
            requests.patch(f"{BACKEND_URL}/batch/jobs/{job_id}/status", json={
                "id": job_id,
                "status": "completed"
            }, timeout=10)
            print(f"✅ İş başarıyla tamamlandı: {job_id}")
            
            # İş bitti, idle sayacını sıfırla (yeni iş aranacak)
            idle_since = time.time()
            
        except Exception as e:
            print(f"❌ Worker hatası: {str(e)}")
            time.sleep(10)
    
    print("🛑 Worker durduruldu.")

if __name__ == "__main__":
    run_worker_loop()
