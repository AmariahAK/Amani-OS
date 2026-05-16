import identity from "../../skills/identity.md?raw";
import arbitration from "../../skills/arbitration.md?raw";
import visualization from "../../skills/visualization.md?raw";
import compressContext from "../../skills/tools/compress-context.md?raw";
import readDocument from "../../skills/tools/read-document.md?raw";

const SKILLS: Record<string, string> = {
  identity,
  arbitration,
  visualization,
  "tools/compress-context": compressContext,
  "tools/read-document": readDocument,
};

export function getSkillsPrompt(): string {
  return Object.entries(SKILLS)
    .map(([name, content]) => `<!-- skill:${name} -->\n${content}`)
    .join("\n\n---\n\n");
}

export function getSkill(name: string): string | undefined {
  return SKILLS[name];
}
