// scripts/generate-types.ts
import { execSync } from "child_process";
import fs from "fs";

const output = execSync(`npx supabase gen types typescript --project-id drvycatabyudymagulio --schema public`).toString("utf-8");

fs.writeFileSync("lib/supabase-types.ts", output, "utf-8");
console.log("✔ Supabase types generated.");