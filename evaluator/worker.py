# -*- coding: utf-8 -*-
import os
import time
import requests
import json
import pandas as pd
from collections import defaultdict
from dotenv import load_dotenv
from engine.feature_extractor import FeatureExtractor
from engine.scorer import Scorer
from reports.generator import ReportGenerator
from utils.data_handler import DataHandler
from tqdm import tqdm

load_dotenv()

# Configuration
BACKEND_URL = os.environ.get("BACKEND_URL", "https://staging-iklim-bu6i.encr.app")
IDLE_TIMEOUT = int(os.environ.get("WORKER_IDLE_TIMEOUT", "120"))  # saniye (varsayılan 2 dakika)
POLL_INTERVAL = 15  # saniye


def run_worker_loop():
    print(f"🔄 Worker döngüsü başlatıldı. Backend: {BACKEND_URL}")
    print(f"⏱️  Boşta kalma zaman aşımı: {IDLE_TIMEOUT} saniye")
    
    # Bileşenleri yükle
    basic, advanced = DataHandler.load_knowledge_components()
    extractor = FeatureExtractor(basic_terms=basic, advanced_terms=advanced)
    scorer = Scorer()
    reporter = ReportGenerator(scorer)
    
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
            student_rows = defaultdict(list)
            
            for msg in tqdm(student_messages, desc=f"İş {job_id}"):
                features = extractor.extract_features(msg["message"])
                
                content_res = scorer.score_with_llm(msg["message"], features, "content")
                dialog_res = scorer.score_with_llm(msg["message"], features, "dialog")
                
                # Mesaj değerlendirmesini backend'e gönder
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

                # Öğrenci bazlı DataFrame satırı biriktir
                student_rows[msg["user_id"]].append({
                    "Sender": "student",
                    "Student": msg.get("display_name", "Bilinmeyen"),
                    "Message": msg["message"],
                    "content_label": content_res["score"],
                    "dialog_label": dialog_res["score"],
                    "content_reasoning": content_res.get("reasoning"),
                    "dialog_reasoning": dialog_res.get("reasoning"),
                })

            # ─── 4. Öğrenci Raporları Oluştur (ReportGenerator kullanarak) ───
            print(f"📊 {len(student_rows)} öğrenci için rapor oluşturuluyor...")

            for student_id, rows in student_rows.items():
                student_name = rows[0]["Student"]
                print(f"  📝 Rapor: {student_name} ({len(rows)} mesaj)")

                # Satırlardan DataFrame oluştur
                df = pd.DataFrame(rows)
                meta = {"school": None, "class": None}

                # ReportGenerator ile rapor üret
                report = reporter.generate_final_report(df, student_name, meta)

                # Backend'e gönder
                report_payload = {
                    "jobId": job_id,
                    "studentId": student_id,
                    "studentName": student_name,
                    "overallScore": report.get("stats", {}).get("overall_score", 0),
                    "stats": report.get("stats", {}),
                    "llmEvaluation": report.get("qualitative_analysis", {}),
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
            
            # İş bitti, idle sayacını sıfırla
            idle_since = time.time()
            
        except Exception as e:
            print(f"❌ Worker hatası: {str(e)}")
            time.sleep(10)
    
    print("🛑 Worker durduruldu.")

if __name__ == "__main__":
    run_worker_loop()
