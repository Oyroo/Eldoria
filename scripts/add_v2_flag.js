const fs = require('fs');
const file = 'c:/Users/lemai/Eldoria Bot/interactions/buttons.js';
let txt = fs.readFileSync(file, 'utf8');
const lines = txt.split(/\r?\n/);
const out = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);
  const trimmed = line.trim();
  if (trimmed.startsWith('return interaction.update({') || trimmed.startsWith('await interaction.update({')) {
    let j = i + 1;
    let hasComponents = false;
    let hasFlags = false;
    while (j < lines.length) {
      const t = lines[j];
      if (/\bcomponents\s*:/i.test(t)) hasComponents = true;
      if (/\bflags\s*:/i.test(t)) hasFlags = true;
      if (t.trim().startsWith('});')) break;
      j++;
    }
    if (hasComponents && !hasFlags) {
      out.splice(j, 0, '            flags:      MessageFlags.IsComponentsV2,');
      i = j;
    }
  }
}
const newText = out.join('\n');
if (newText !== txt) {
  fs.writeFileSync(file, newText, 'utf8');
  console.log('Updated', file);
} else {
  console.log('No changes');
}
