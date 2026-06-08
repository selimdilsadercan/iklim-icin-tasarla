# -*- coding: utf-8 -*-
import pandas as pd
from datetime import datetime

class ReportGenerator:
    def __init__(self, scorer_instance):
        self.scorer = scorer_instance
        self.dialog_map = {"A": 0, "B": 1, "C": 2, "D": 3}
        self.num_to_dialog = {v: k for k, v in self.dialog_map.items()}
        self.score_map = {0: 1, 1: 6, 2: 10, 3: 14}
        self.score_scale_max = 14.0
        self.low_evidence_tolerance = 0.10
        self.max_penalty_mlp = 0.30
        self.penalty_curve = 1.6
        self.ease_x1 = 0.30
        self.ease_y1 = 0.09
        self.ease_x2 = 0.35
        self.ease_y2 = 1.00

    @staticmethod
    def _clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
        return max(lower, min(upper, value))

    @staticmethod
    def _cubic_bezier(t: float, p1: float, p2: float) -> float:
        inv_t = 1.0 - t
        return (
            3.0 * inv_t * inv_t * t * p1
            + 3.0 * inv_t * t * t * p2
            + t * t * t
        )

    def _ease_score(self, normalized_value: float) -> float:
        """Evaluate cubic-bezier(0.3, 0.09, 0.35, 1) for a 0-1 input."""
        target_x = self._clamp(normalized_value)
        low = 0.0
        high = 1.0

        for _ in range(30):
            t = (low + high) / 2.0
            x = self._cubic_bezier(t, self.ease_x1, self.ease_x2)
            if x < target_x:
                low = t
            else:
                high = t

        t = (low + high) / 2.0
        return self._clamp(self._cubic_bezier(t, self.ease_y1, self.ease_y2))

    def compute_statistics(self, df: pd.DataFrame) -> dict:
        """Etiketlenmiş veriden pedagojik istatistikleri hesaplar"""
        sdf = df[df["Sender"] == "student"].copy()
        if sdf.empty: return {}

        # Veri tiplerini zorla
        sdf["content_label"] = pd.to_numeric(sdf["content_label"], errors='coerce').fillna(0).clip(0, 3)
        sdf["content_level"] = sdf["content_label"].round().astype(int).clip(0, 3)
        sdf["dialog_label"] = sdf["dialog_label"].astype(str).str.strip().str.upper()
        sdf["dialog_num"] = sdf["dialog_label"].map(self.dialog_map).fillna(0).clip(0, 3)
        sdf["dialog_level"] = sdf["dialog_num"].round().astype(int).clip(0, 3)
        sdf["content_scaled"] = sdf["content_level"].map(self.score_map).fillna(1)
        sdf["dialog_scaled"] = sdf["dialog_level"].map(self.score_map).fillna(1)

        n = len(sdf)
        avg_content = sdf["content_label"].mean()
        avg_dialog_num = sdf["dialog_num"].mean()
        avg_dialog_cat = self.num_to_dialog[int(round(avg_dialog_num))]

        # Gelişim trendi
        if n >= 4:
            first_score = sdf.iloc[:2]["content_label"].mean()
            last_score  = sdf.iloc[-2:]["content_label"].mean()
        elif n >= 2:
            first_score = float(sdf.iloc[0]["content_label"])
            last_score  = float(sdf.iloc[-1]["content_label"])
        else:
            first_score = last_score = float(sdf.iloc[0]["content_label"])

        if last_score > first_score + 0.5: trend = "Yükselen (Öğrenme Gerçekleşiyor)"
        elif last_score < first_score - 0.5: trend = "Düşen (Odak Kaybı veya Zorlanma)"
        else: trend = "Stabil (Seviye Korunuyor)"

        # Dağılımlar
        content_dist = {str(k): int(v) for k, v in sorted(sdf["content_label"].value_counts().items())}
        dialog_dist  = {str(k): int(v) for k, v in sorted(sdf["dialog_label"].value_counts().items())}

        # Genel puan (1-10): içerik ve diyalog eksenleri eşit ağırlıklı.
        low_evidence_mask = (sdf["content_level"] == 0) & (sdf["dialog_level"] == 0)
        scored_sdf = sdf[~low_evidence_mask]

        if scored_sdf.empty:
            content_axis = 0.0
            dialog_axis = 0.0
        else:
            content_axis = float((scored_sdf["content_scaled"] / self.score_scale_max).mean())
            dialog_axis = float((scored_sdf["dialog_scaled"] / self.score_scale_max).mean())

        raw_normalized = self._clamp((content_axis + dialog_axis) / 2.0)
        raw_value = raw_normalized * 10.0
        message_count_multiplier = min(1.0, n / 20.0)
        curved_value_before_message_multiplier = self._ease_score(raw_normalized) * 10.0
        curved_value = message_count_multiplier * curved_value_before_message_multiplier

        low_evidence_count = int(low_evidence_mask.sum())
        low_evidence_ratio = low_evidence_count / n
        excess_ratio = max(0.0, low_evidence_ratio - self.low_evidence_tolerance)
        penalty_ratio = 0.0
        if self.low_evidence_tolerance < 1.0:
            penalty_ratio = self._clamp(excess_ratio / (1.0 - self.low_evidence_tolerance))
        low_evidence_penalty = penalty_ratio ** self.penalty_curve

        # max_penalty_mlp is the minimum remaining multiplier at full penalty.
        score_multiplier = 1.0 - low_evidence_penalty * (1.0 - self.max_penalty_mlp)
        overall_score = 1.0 + 0.9 * curved_value * score_multiplier
        overall_score = max(1.0, min(10.0, round(overall_score, 1)))

        return {
            "overall_score": overall_score,
            "avg_content_score": round(avg_content, 2),
            "avg_dialog_score": round(avg_dialog_num, 2),
            "avg_discussion_score": round(avg_dialog_num, 2),
            "avg_dialog_level_category": avg_dialog_cat,
            "trend": trend,
            "content_score_distribution": content_dist,
            "dialog_level_distribution": dialog_dist,
            "message_count": n,
            "score_components": {
                "content_axis_normalized": round(content_axis, 3),
                "dialog_axis_normalized": round(dialog_axis, 3),
                "raw_normalized": round(raw_normalized, 3),
                "raw_value": round(raw_value, 3),
                "curved_value_before_message_multiplier": round(curved_value_before_message_multiplier, 3),
                "message_count_multiplier": round(message_count_multiplier, 3),
                "curved_value": round(curved_value, 3),
                "low_evidence_message_count": low_evidence_count,
                "scored_message_count": int(len(scored_sdf)),
                "low_evidence_ratio": round(low_evidence_ratio, 3),
                "low_evidence_tolerance": self.low_evidence_tolerance,
                "excess_ratio": round(excess_ratio, 3),
                "penalty_ratio": round(penalty_ratio, 3),
                "penalty_curve": self.penalty_curve,
                "low_evidence_penalty": round(low_evidence_penalty, 3),
                "max_penalty_mlp": self.max_penalty_mlp,
                "score_multiplier": round(score_multiplier, 3),
                "score_map": self.score_map,
                "score_scale_max": self.score_scale_max
            }
        }

    def generate_final_report(self, df: pd.DataFrame, student_name: str, meta: dict) -> dict:
        """İstatistikleri ve LLM özetini birleştirir"""
        stats = self.compute_statistics(df)
        
        # Claude için özet prompt'u
        msg_summary = "\n".join([f"- {row['Message'][:100]} (C:{row['content_label']} D:{row['dialog_label']})" 
                                for _, row in df[df['Sender']=='student'].iterrows()])
        
        prompt = f"""Bir eğitim uzmanı olarak şu öğrenciyi değerlendir:
Öğrenci: {student_name}
İstatistikler: {stats}
Mesajlar:
{msg_summary}

Lütfen şu formatta bir JSON döndür:
{{
  "engagement_level": "<Düşük|Orta|Yüksek>",
  "conversation_themes": ["tema1", "tema2"],
  "summary_paragraph": "Türkçe 2-3 cümlelik pedagojik özet."
}}"""

        # Scorer içindeki LLM'i kullanarak özeti al
        try:
            llm_eval = self.scorer.score_with_llm(prompt, {}, score_type="summary") # placeholder features {}
        except:
            llm_eval = {"engagement_level": "Bilinmiyor", "summary_paragraph": "Özet oluşturulamadı."}

        return {
            "metadata": {
                "student_name": student_name,
                "school": meta.get("school"),
                "class": meta.get("class"),
                "generated_at": datetime.now().isoformat()
            },
            "stats": stats,
            "qualitative_analysis": llm_eval
        }
