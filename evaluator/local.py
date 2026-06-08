# -*- coding: utf-8 -*-
import os
import requests
import json
import pandas as pd
import questionary
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv
from tqdm import tqdm

# Evaluator bileşenlerini içe aktar
from engine.feature_extractor import FeatureExtractor
from engine.scorer import Scorer
from reports.generator import ReportGenerator
from utils.data_handler import DataHandler

# .env dosyasını yükle
load_dotenv()

# Yapılandırma
BACKEND_URL = os.environ.get("BACKEND_URL", "https://staging-iklim-bu6i.encr.app")
OUTPUT_DIR = "outputs"

def get_date_range(preset, custom_start=None, custom_end=None):
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    
    if preset == "Bugün":
        return today_str, today_str
    elif preset == "Bu Hafta":
        start = today - timedelta(days=today.weekday())
        return start.strftime("%Y-%m-%d"), today_str
    elif preset == "Bu Ay":
        start = today.replace(day=1)
        return start.strftime("%Y-%m-%d"), today_str
    elif preset == "Tüm Zamanlar (2024'ten beri)":
        return "2024-01-01", today_str
    return "2024-01-01", today_str

def run_local_evaluator():
    # Stil tanımlamaları
    custom_style = questionary.Style([
        ('qmark', 'fg:#673ab7 bold'),       # Soru işareti
        ('question', 'bold'),               # Soru metni
        ('answer', 'fg:#f44336 bold'),      # Seçilen cevap
        ('pointer', 'fg:#673ab7 bold'),     # Ok işareti
        ('highlighted', 'fg:#673ab7 bold'), # Üzerinde durulan seçenek
        ('selected', 'fg:#4caf50'),         # Seçili olan (checkbox)
        ('separator', 'fg:#cc5454'),        # Ayırıcılar
        ('instruction', 'fg:#888888 italic'), # Talimatlar
    ])

    print("\n" + "="*50)
    print("🌿  IKLIM-EVAL YEREL ANALIZ ARACI")
    print("="*50)
    print(f"🔗 Backend: {BACKEND_URL}\n")

    # 1. Sınıfları Getir
    print("⏳ Sınıf listesi alınıyor...")
    try:
        response = requests.get(f"{BACKEND_URL}/classes", timeout=10)
        response.raise_for_status()
        classes = response.json().get("classes", [])
    except Exception as e:
        print(f"❌ Sınıflar alınamadı: {e}")
        return

    if not classes:
        print("❌ Hiç sınıf bulunamadı.")
        return

    # 2. Sınıf Seçimi (Multi-select)
    class_choices = [
        questionary.Choice(
            title=f"{c['name']} ({c.get('student_count', 0)} öğrenci)",
            value=c
        ) for c in classes
    ]

    selected_classes = questionary.checkbox(
        "Analiz edilecek sınıfları seçin:",
        choices=class_choices,
        style=custom_style,
        instruction="(Boşluk ile seçin, Enter ile onaylayın)"
    ).ask()

    if not selected_classes:
        print("⚠️ Hiçbir sınıf seçilmedi. Çıkılıyor.")
        return

    # 3. Tarih Aralığı Seçimi (Önceden sayıları hesaplayarak)
    print("\n⏳ Tarih aralıkları için mesaj sayıları hesaplanıyor...")
    
    preset_options = [
        {"id": "today", "name": "Bugün"},
        {"id": "this_week", "name": "Bu Hafta"},
        {"id": "this_month", "name": "Bu Ay"},
        {"id": "all", "name": "Tüm Zamanlar (2024'ten beri)"}
    ]
    
    choices = []
    for p in preset_options:
        p_start, p_end = get_date_range(p['name'])
        p_total_msg = 0
        for cls in selected_classes:
            try:
                params = {"startDate": p_start, "endDate": p_end}
                res = requests.get(f"{BACKEND_URL}/classes/{cls['id']}/students", params=params, timeout=5)
                if res.status_code == 200:
                    students = res.json().get("students", [])
                    p_total_msg += sum(s.get('total_conversations', 0) for s in students)
            except:
                pass
        
        choices.append(questionary.Choice(
            title=f"{p['name']} ({p_total_msg} mesaj)",
            value=p['name']
        ))
    
    choices.append(questionary.Choice(title="Özel Tarih Aralığı", value="Özel Tarih Aralığı"))

    date_preset = questionary.select(
        "Tarih aralığı seçin:",
        choices=choices,
        style=custom_style
    ).ask()

    if date_preset == "Özel Tarih Aralığı":
        today_str = datetime.now().strftime("%Y-%m-%d")
        start_date = questionary.text(
            "Başlangıç Tarihi (YYYY-MM-DD):",
            default="2024-01-01",
            style=custom_style
        ).ask()
        end_date = questionary.text(
            "Bitiş Tarihi (YYYY-MM-DD):",
            default=today_str,
            style=custom_style
        ).ask()
    else:
        start_date, end_date = get_date_range(date_preset)

    print(f"\n📅 Seçilen Aralık: {start_date} - {end_date}")

    # 4. Ön İzleme: Tüm seçili sınıflar için verileri topla
    all_active_students = []
    total_messages_to_process = 0
    
    print(f"\n🔍 Veriler taranıyor...")
    
    for cls in selected_classes:
        try:
            params = {"startDate": start_date, "endDate": end_date}
            response = requests.get(f"{BACKEND_URL}/classes/{cls['id']}/students", params=params, timeout=10)
            response.raise_for_status()
            students = response.json().get("students", [])
            
            cls_messages = sum(s.get('total_conversations', 0) for s in students)
            cls_active = [s for s in students if s.get('total_conversations', 0) > 0]
            
            # Sınıf adını her öğrenciye ekleyelim (rapor için)
            for s in cls_active:
                s['class_name'] = cls['name']
            
            all_active_students.extend(cls_active)
            total_messages_to_process += cls_messages
            print(f"  ✅ {cls['name']}: {len(cls_active)} aktif öğrenci, {cls_messages} mesaj")
        except Exception as e:
            print(f"  ❌ {cls['name']} verileri alınamadı: {e}")

    if total_messages_to_process == 0:
        print("\n⚠️ Seçilen sınıflarda ve tarih aralığında hiç mesaj bulunamadı.")
        return

    print(f"\n" + "-"*30)
    print(f"📊 TOPLAM ÖZET")
    print(f"👥 Aktif Öğrenci: {len(all_active_students)}")
    print(f"📩 Toplam Mesaj: {total_messages_to_process}")
    print("-"*30)

    should_start = questionary.confirm(
        "Analizi başlatmak istiyor musunuz?",
        default=True,
        style=custom_style
    ).ask()

    if not should_start:
        print("❌ İşlem iptal edildi.")
        return

    # 5. Her öğrenci için mesajları çek ve analiz et
    # Not: Mevcut backend yapısında toplu mesaj çekmek için Job oluşturmak gerekiyor.
    # Her sınıf için ayrı job oluşturup mesajları çekelim.
    
    all_messages = []
    
    for cls in selected_classes:
        cls_student_ids = [s['user_id'] for s in all_active_students if s['class_name'] == cls['name']]
        if not cls_student_ids: continue
        
        print(f"\n🚀 {cls['name']} için mesajlar indiriliyor...")
        try:
            job_payload = {
                "classId": cls['id'],
                "studentIds": cls_student_ids,
                "startDate": start_date,
                "endDate": end_date
            }
            response = requests.post(f"{BACKEND_URL}/batch/jobs", json=job_payload, timeout=10)
            response.raise_for_status()
            job_id = response.json()['id']
            
            msg_response = requests.get(f"{BACKEND_URL}/batch/jobs/{job_id}/messages", timeout=30)
            msg_response.raise_for_status()
            cls_msgs = msg_response.json().get("messages", [])
            
            # Sınıf bilgisini mesajlara ekle
            for m in cls_msgs:
                m['class_name'] = cls['name']
            
            all_messages.extend(cls_msgs)
            
            # Job'ı tamamlandı yap
            requests.patch(f"{BACKEND_URL}/batch/jobs/{job_id}/status", json={"id": job_id, "status": "completed"}, timeout=5)
        except Exception as e:
            print(f"  ❌ {cls['name']} mesajları alınamadı: {e}")

    if not all_messages:
        print("⚠️ Hiç mesaj indirilemedi.")
        return

    print(f"✅ Toplam {len(all_messages)} mesaj indirildi. Yerel analiz başlıyor...")

    # 7. Yerel Analiz (Aynı mantık devam eder)
    basic, advanced = DataHandler.load_knowledge_components()
    extractor = FeatureExtractor(basic_terms=basic, advanced_terms=advanced)
    scorer = Scorer()
    reporter = ReportGenerator(scorer)

    student_messages = [m for m in all_messages if m["is_user"]]
    student_rows = defaultdict(list)

    for msg in tqdm(student_messages, desc="Analiz ediliyor"):
        features = extractor.extract_features(msg["message"])
        
        content_res = scorer.score_with_llm(msg["message"], features, "content")
        dialog_res = scorer.score_with_llm(msg["message"], features, "dialog")
        
        student_rows[msg["student_id"]].append({
            "Sender": "student",
            "Student": msg.get("display_name", "Bilinmeyen"),
            "Message": msg["message"],
            "content_label": content_res["score"],
            "dialog_label": dialog_res["score"],
            "content_reasoning": content_res.get("reasoning"),
            "dialog_reasoning": dialog_res.get("reasoning"),
            "class_name": msg.get('class_name')
        })

    # 8. Raporları Oluştur ve Kaydet
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_output_dir = os.path.join(OUTPUT_DIR, f"batch_{timestamp}")
    os.makedirs(batch_output_dir)

    print(f"\n📊 Raporlar oluşturuluyor...")
    all_reports = []

    for student_id, rows in student_rows.items():
        student_name = rows[0]["Student"]
        class_name = rows[0].get("class_name", "Bilinmiyor")
        df = pd.DataFrame(rows)
        meta = {"school": None, "class": class_name}
        
        report = reporter.generate_final_report(df, student_name, meta)
        all_reports.append(report)
        
        # Bireysel raporu kaydet
        safe_name = "".join(x for x in student_name if x.isalnum() or x in "._- ").strip()
        report_path = os.path.join(batch_output_dir, f"{class_name}_{safe_name}.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

    # Özet dosyası
    summary_path = os.path.join(batch_output_dir, "summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(all_reports, f, ensure_ascii=False, indent=2)

    print(f"\n✨ Analiz tamamlandı!")
    print(f"📁 Sonuçlar: {batch_output_dir}")
    print(f"📝 Toplam {len(all_reports)} öğrenci raporu oluşturuldu.")
    print("🚀 Analiz işi oluşturuluyor...")
    try:
        job_payload = {
            "classId": class_id,
            "studentIds": student_ids,
            "startDate": start_date,
            "endDate": end_date
        }
        response = requests.post(f"{BACKEND_URL}/batch/jobs", json=job_payload, timeout=10)
        response.raise_for_status()
        job_data = response.json()
        job_id = job_data['id']
    except Exception as e:
        print(f"❌ İş oluşturulamadı: {e}")
        return

    # 6. Mesajları Getir
    print(f"📩 Mesajlar indiriliyor (Job ID: {job_id})...")
    try:
        response = requests.get(f"{BACKEND_URL}/batch/jobs/{job_id}/messages", timeout=30)
        response.raise_for_status()
        messages = response.json().get("messages", [])
    except Exception as e:
        print(f"❌ Mesajlar alınamadı: {e}")
        return

    if not messages:
        print("⚠️ Belirtilen tarih aralığında mesaj bulunamadı.")
        return

    print(f"✅ {len(messages)} mesaj bulundu. Yerel analiz başlıyor...")

    # 7. Yerel Analiz
    basic, advanced = DataHandler.load_knowledge_components()
    extractor = FeatureExtractor(basic_terms=basic, advanced_terms=advanced)
    scorer = Scorer()
    reporter = ReportGenerator(scorer)

    student_messages = [m for m in messages if m["is_user"]]
    student_rows = defaultdict(list)

    for msg in tqdm(student_messages, desc="Analiz ediliyor"):
        features = extractor.extract_features(msg["message"])
        
        content_res = scorer.score_with_llm(msg["message"], features, "content")
        dialog_res = scorer.score_with_llm(msg["message"], features, "dialog")
        
        student_rows[msg["student_id"]].append({
            "Sender": "student",
            "Student": msg.get("display_name", "Bilinmeyen"),
            "Message": msg["message"],
            "content_label": content_res["score"],
            "dialog_label": dialog_res["score"],
            "content_reasoning": content_res.get("reasoning"),
            "dialog_reasoning": dialog_res.get("reasoning"),
        })

    # 8. Raporları Oluştur ve Kaydet
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_output_dir = os.path.join(OUTPUT_DIR, f"batch_{timestamp}")
    os.makedirs(batch_output_dir)

    print(f"\n📊 Raporlar oluşturuluyor...")
    all_reports = []

    for student_id, rows in student_rows.items():
        student_name = rows[0]["Student"]
        df = pd.DataFrame(rows)
        meta = {"school": None, "class": selected_class['name']}
        
        report = reporter.generate_final_report(df, student_name, meta)
        all_reports.append(report)
        
        # Bireysel raporu kaydet
        safe_name = "".join(x for x in student_name if x.isalnum() or x in "._- ").strip()
        report_path = os.path.join(batch_output_dir, f"{safe_name}.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

    # Özet dosyası
    summary_path = os.path.join(batch_output_dir, "summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(all_reports, f, ensure_ascii=False, indent=2)

    # 9. İş Durumunu Güncelle (Opsiyonel)
    try:
        requests.patch(f"{BACKEND_URL}/batch/jobs/{job_id}/status", json={
            "id": job_id,
            "status": "completed"
        }, timeout=10)
    except:
        pass

    print(f"\n✨ Analiz tamamlandı!")
    print(f"📁 Sonuçlar şuraya kaydedildi: {batch_output_dir}")
    print(f"📝 Toplam {len(all_reports)} öğrenci raporu oluşturuldu.")

if __name__ == "__main__":
    run_local_evaluator()
