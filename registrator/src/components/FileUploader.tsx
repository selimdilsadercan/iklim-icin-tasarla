import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface FileUploaderProps {
  onFileProcessed: (data: any[]) => void;
  onError: (error: string) => void;
}

export const FileUploader = ({
  onFileProcessed,
  onError,
}: FileUploaderProps) => {
  const handleFile = useCallback(
    (file: File) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (fileExtension === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: (results) => {
            onFileProcessed(results.data);
          },
          error: (error) => {
            onError(`CSV okuma hatası: ${error.message}`);
          },
        });
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });

            // Look for "Tablo" sheet first
            const targetSheetName = "Tablo";
            let sheetToUse = workbook.Sheets[targetSheetName];

            // If "Tablo" not found, try other common names
            if (!sheetToUse) {
              const alternativeNames = [
                "2025-2026 Öğrenci Bilgileri",
                "Öğrenci Bilgileri",
                "Tablo 1",
              ];
              for (const name of alternativeNames) {
                if (workbook.Sheets[name]) {
                  console.log(`"${name}" sayfası kullanılıyor.`);
                  sheetToUse = workbook.Sheets[name];
                  break;
                }
              }
            }

            // If still not found, use first sheet but warn user
            if (!sheetToUse) {
              console.warn(
                `"${targetSheetName}" sayfası bulunamadı. Mevcut sayfalar: ${workbook.SheetNames.join(
                  ", "
                )}. İlk sayfa kullanılıyor.`
              );
              sheetToUse = workbook.Sheets[workbook.SheetNames[0]];
            }

            // Robust parsing: find header row and read only required columns
            const rows = XLSX.utils.sheet_to_json(sheetToUse, {
              header: 1,
              defval: "",
            }) as any[][];

            if (!rows || rows.length === 0) {
              onError(
                'Excel sayfası boş. Lütfen "Tablo" sayfasının dolu olduğundan emin olun.'
              );
              return;
            }

            // Normalize helper (handle Turkish chars, underscores, slashes and spaces)
            const norm = (v: any) =>
              v
                ?.toString()
                .trim()
                .toLowerCase()
                .replace(/[_\-/]/g, " ")
                .replace(/[ıİ]/g, "i")
                .replace(/\s+/g, " ") || "";

            // Locate header row and column indices
            // Handle case where headers span multiple rows
            let headerRowIndex = -1;
            let colOkulKod = -1,
              colSinif = -1,
              colOkulNo = -1,
              colAdSoyad = -1,
              colOgretmen = -1;

            // Debug: Log first 5 rows to see what we're getting
            for (let i = 0; i < Math.min(rows.length, 5); i++) {
              console.log(`Row ${i}:`, rows[i]);
            }

            // Check rows individually first
            for (let i = 0; i < Math.min(rows.length, 5); i++) {
              const normalized = (rows[i] || []).map(norm);
              const findIdx = (labels: string[]) =>
                normalized.findIndex((c) => labels.includes(c));

              const idxAdSoyad = findIdx(["ad", "ad soyad", "adsoyad", "name"]);
              const idxOkulNo = findIdx([
                "numara",
                "num",
                "okul no",
                "okulno",
                "no",
                "student no",
              ]);
              const idxSinif = findIdx([
                "sinif",
                "sinif ",
                "class",
                "snf",
                "snnf",
                "sinif no",
                "kodlandirma",
              ]);
              const idxOkulKod = findIdx([
                "okulkodu",
                "okul kodu",
                "okulkod",
                "okul kod",
                "okul_kod",
                "okul ad",
                "okulismi",
                "okulismi",
              ]);
              const idxOgretmen = findIdx(["hoca", "teacher", "ogretmen"]);

              // If we found ad, numara, sinif in this single row
              if (idxAdSoyad > -1 && idxOkulNo > -1 && idxSinif > -1) {
                headerRowIndex = i;
                colAdSoyad = idxAdSoyad;
                colOkulNo = idxOkulNo;
                colSinif = idxSinif;
                colOkulKod = idxOkulKod > -1 ? idxOkulKod : colOkulKod;
                colOgretmen = idxOgretmen > -1 ? idxOgretmen : colOgretmen;
                break;
              }
            }

            // If not found in a single row, try combining row 0 and row 1
            if (headerRowIndex === -1 && rows.length >= 2) {
              console.log("Headers span multiple rows, combining rows 0 and 1");
              const normalizedRow0 = (rows[0] || []).map(norm);
              const normalizedRow1 = (rows[1] || []).map(norm);

              const findIdxInRow = (row: string[], labels: string[]) =>
                row.findIndex((c) => labels.includes(c));

              const idxAdSoyad =
                findIdxInRow(normalizedRow1, [
                  "ad",
                  "ad soyad",
                  "adsoyad",
                  "name",
                ]) > -1
                  ? findIdxInRow(normalizedRow1, [
                      "ad",
                      "ad soyad",
                      "adsoyad",
                      "name",
                    ])
                  : findIdxInRow(normalizedRow0, [
                      "ad",
                      "ad soyad",
                      "adsoyad",
                      "name",
                    ]);

              const idxOkulNo =
                findIdxInRow(normalizedRow1, [
                  "numara",
                  "num",
                  "okul no",
                  "okulno",
                  "no",
                ]) > -1
                  ? findIdxInRow(normalizedRow1, [
                      "numara",
                      "num",
                      "okul no",
                      "okulno",
                      "no",
                    ])
                  : findIdxInRow(normalizedRow0, [
                      "numara",
                      "num",
                      "okul no",
                      "okulno",
                      "no",
                    ]);

              const idxSinif =
                findIdxInRow(normalizedRow1, [
                  "sinif",
                  "sinif ",
                  "kodlandirma",
                  "class",
                ]) > -1
                  ? findIdxInRow(normalizedRow1, [
                      "sinif",
                      "sinif ",
                      "kodlandirma",
                      "class",
                    ])
                  : findIdxInRow(normalizedRow0, [
                      "sinif",
                      "sinif ",
                      "kodlandirma",
                      "class",
                    ]);

              const idxOkulKod =
                findIdxInRow(normalizedRow0, [
                  "okulkodu",
                  "okul kodu",
                  "okulkod",
                  "okul ad",
                  "okulismi",
                ]) > -1
                  ? findIdxInRow(normalizedRow0, [
                      "okulkodu",
                      "okul kodu",
                      "okulkod",
                      "okul ad",
                      "okulismi",
                    ])
                  : findIdxInRow(normalizedRow1, [
                      "okulkodu",
                      "okul kodu",
                      "okulkod",
                      "okul ad",
                      "okulismi",
                    ]);

              const idxOgretmen =
                findIdxInRow(normalizedRow0, ["hoca", "teacher", "ogretmen"]) >
                -1
                  ? findIdxInRow(normalizedRow0, [
                      "hoca",
                      "teacher",
                      "ogretmen",
                    ])
                  : findIdxInRow(normalizedRow1, [
                      "hoca",
                      "teacher",
                      "ogretmen",
                    ]);

              if (idxAdSoyad > -1 && idxOkulNo > -1 && idxSinif > -1) {
                headerRowIndex = 1; // Use row 1 as the header since it has the student columns
                colAdSoyad = idxAdSoyad;
                colOkulNo = idxOkulNo;
                colSinif = idxSinif;
                colOkulKod = idxOkulKod;
                colOgretmen = idxOgretmen;
                console.log("✓ Headers found spanning rows 0 and 1");
              }
            }

            if (headerRowIndex === -1) {
              onError(
                'Başlıklar bulunamadı. Aranan sütunlar: "Ad" (G), "Numara" (F), "Sınıf" (C). İsteğe bağlı: "Hoca" (E), "Okulkodu" (B)'
              );
              return;
            }

            // Log the actual column names found
            if (colOgretmen === -1) {
              console.log(
                "WARNING: Teacher column not found. Looking for: teacher, hoca, ogretmen"
              );
              console.log("Available columns:", rows[headerRowIndex]);
            } else {
              console.log(
                "✓ Teacher column found at index:",
                colOgretmen,
                "value:",
                rows[headerRowIndex][colOgretmen]
              );
            }

            // Build cleaned dataset with forward-fill for merged cells
            // When we see a new Sınıf value, treat it as the start of a new group
            const cleaned: any[] = [];
            let currentOkulKod = "";
            let currentSinif = "";
            let currentOgretmen = "";

            for (let r = headerRowIndex + 1; r < rows.length; r++) {
              const rowArr = rows[r] || [];
              const adSoyadRaw = rowArr[colAdSoyad];
              const okulNoRaw = rowArr[colOkulNo];
              const sinifRaw = colSinif > -1 ? rowArr[colSinif] : "";
              const okulKodRaw = colOkulKod > -1 ? rowArr[colOkulKod] : "";
              const ogretmenRaw = colOgretmen > -1 ? rowArr[colOgretmen] : "";

              // Skip fully empty lines
              if (
                [
                  adSoyadRaw,
                  okulNoRaw,
                  sinifRaw,
                  okulKodRaw,
                  ogretmenRaw,
                ].every((v) => !v || v.toString().trim() === "")
              ) {
                continue;
              }

              // If this row has Sınıf value, it's a new group
              if (sinifRaw) {
                currentSinif = sinifRaw.toString().trim();
              }

              // Update current values when we find them
              if (ogretmenRaw) {
                currentOgretmen = ogretmenRaw.toString().trim();
              }

              if (okulKodRaw) {
                currentOkulKod = okulKodRaw.toString().trim();
              }

              // Get student data
              const adSoyad = adSoyadRaw?.toString().trim();
              const okulNo = okulNoRaw?.toString().trim();

              // Only include rows with student data AND a class assignment
              if (adSoyad && okulNo && currentSinif) {
                const rowData: any = {
                  Okulkodu: currentOkulKod,
                  Sınıf: currentSinif,
                  Numara: okulNo,
                  Ad: adSoyad,
                };

                if (currentOgretmen) {
                  rowData["Hoca"] = currentOgretmen;
                }

                cleaned.push(rowData);
              }
            }

            if (!cleaned.length) {
              onError(
                "Excel verileri okunamadı. Lütfen gerekli sütunların doğru doldurulduğunu kontrol edin."
              );
              return;
            }

            onFileProcessed(cleaned);
          } catch (error) {
            onError(
              `Excel okuma hatası: ${
                error instanceof Error ? error.message : "Bilinmeyen hata"
              }`
            );
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        onError(
          "Desteklenmeyen dosya formatı. Lütfen CSV veya Excel dosyası yükleyin."
        );
      }
    },
    [onFileProcessed, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-white/5 transition-all backdrop-blur-sm"
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium text-foreground mb-2">
            Dosyayı sürükleyip bırakın veya seçmek için tıklayın
          </p>
          <p className="text-sm text-muted-foreground">
            Desteklenen formatlar: CSV, XLSX, XLS
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Gerekli sütunlar: <strong>Ad</strong> (G), <strong>Numara</strong>{" "}
            (F), <strong>Sınıf</strong> (C)
            <br />
            İsteğe bağlı: <strong>Hoca</strong> (E), <strong>Okulkodu</strong>{" "}
            (B) - dosya adı için kullanılır
          </p>
        </label>
      </div>
    </div>
  );
};
