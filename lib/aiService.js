import Anthropic from '@anthropic-ai/sdk';
import { parse as babelParse } from '@babel/parser';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const validateJsx = (code) => {
  if (!code || typeof code !== 'string') return { ok: false, error: 'Empty output' };
  try {
    babelParse(code, {
      sourceType: 'module',
      plugins: ['jsx'],
      errorRecovery: false,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

/** Strip opening/closing triple-backtick fences from any language block. */
const stripFences = (s) => {
  const text = (s || '').trim();
  if (!text.startsWith('```')) return text;
  return text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
};

const DS_CONFIG = {
  material: {
    name: 'Material UI v9 (modern API)',
    pkg: '@mui/material',
    style: `Material Design — ThemeProvider + createTheme, AppBar + Toolbar for header, Box sidebar with List/ListItemButton, Paper + Grid (v2) for stat cards, TableContainer/Table/TableHead/TableBody/TableRow/TableCell for data, Chip for status badges.

CRITICAL — MUI v9 API (DIFFERENT from older versions):
- Grid: do NOT use the \`item\` prop. Just use \`<Grid xs={12} sm={6} md={4}>...</Grid>\` directly. NO \`<Grid item xs={...}>\`.
- ListItemText: do NOT use \`primaryTypographyProps={{...}}\`. Use either \`<ListItemText primary="Label" />\` (plain) or \`<ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }} primary="Label" />\` for styling.
- Don't import deprecated/removed components. Stick to: Box, Stack, Paper, Card, CardContent, AppBar, Toolbar, List, ListItemButton, ListItemText, Grid, Table*, Chip, Button, Avatar, Typography, useMediaQuery, ThemeProvider, createTheme.
- Wrap everything in ThemeProvider.`,
  },
  ant: {
    name: 'Ant Design v6 (modern API)',
    pkg: 'antd',
    style: `Enterprise design — ConfigProvider wrapper, Layout/Header/Sider/Content, Menu with items prop (array of {key, label}), Card + Row/Col + Statistic for stats, Table with dataSource + columns array (use render for Tag status), Tag for status.

CRITICAL — Antd v6 API (DIFFERENT from v5):
- Statistic: do NOT use \`valueStyle={{...}}\`. Use \`styles={{ value: { color: '#1890ff' } }}\` instead.
- Do NOT use the \`<List>\` component (deprecated in v6). For lists, use plain divs/Cards or Menu.
- Space: use \`orientation="vertical"\` instead of \`direction="vertical"\`.
- Stick to: ConfigProvider, Layout, Menu, Card, Row, Col, Statistic, Table, Tag, Button, Avatar, Space, Typography, Grid (Grid.useBreakpoint).`,
  },
  carbon: {
    name: 'IBM Carbon v11',
    pkg: '@carbon/react',
    style: 'IBM design — Theme component wrapper with theme="g10", Header + HeaderName, SideNav + SideNavItems + SideNavLink, Tile for stat cards in a Grid/Column layout, DataTable with rows/headers arrays + Table/TableHead/TableRow/TableHeader/TableBody/TableCell, Tag for status.',
  },
  chakra: {
    name: 'Chakra UI v2',
    pkg: '@chakra-ui/react',
    style: 'Chakra — ChakraProvider wrapper with extendTheme, Flex/Box/HStack/VStack layout, Card/CardBody for stat cards, Table/Thead/Tbody/Tr/Th/Td + TableContainer for data, Badge with colorScheme prop, Avatar, Button with colorScheme.',
  },
  mantine: {
    name: 'Mantine v7',
    pkg: '@mantine/core',
    style: 'Mantine — MantineProvider wrapper, Box for layout, NavLink for sidebar items, Paper with withBorder for cards, Table with Table.Thead/Table.Tbody/Table.Tr/Table.Th/Table.Td dot notation, Badge with color + variant="light", SimpleGrid for stat grid, Button, Avatar, Group, Stack, Text, Title.',
  },
};

const TYPE_CONTEXT = {
  dashboard:  'analytics dashboard with KPI metric cards, a recent activity table, and overview stats',
  crm:        'CRM with contact/account list table, pipeline stats, deal status tracking',
  analytics:  'analytics platform with metric cards, performance data table, and trend indicators',
  admin:      'admin panel with user management table, role/permission badges, settings navigation',
};

const formatConceptForPrompt = (concept) => {
  if (!concept) return '';
  const features = (concept.features || [])
    .map((feature, i) => `  ${i + 1}. ${feature.name}${feature.rationale ? ' — ' + feature.rationale : ''}`)
    .join('\n');
  const kpis = (concept.kpis || []).map((kpi) => `  • ${kpi.metric}`).join('\n');
  const audience = (concept.audience || []).map((member) => `  • ${member.role}`).join('\n');
  return `

CONCEPT BRIEF (use this as the source of truth for app name, navigation, and content):
PRODUCT NAME: ${concept.name || ''}
TAGLINE: ${concept.tagline || ''}
DESCRIPTION: ${concept.description || ''}
AUDIENCE:
${audience}
FEATURES (use as sidebar nav items, in this order):
${features}
KPIS (use as stat cards):
${kpis}

When building the UI: use PRODUCT NAME as the app title in the header. Use FEATURES as sidebar nav items (each feature name becomes a nav label; the first feature is the default selected section). Use KPIs as the 3-4 stat cards on the Dashboard section. Sample table data should reflect the audience and product domain.
`;
};

const buildUserPromptForCode = (projectType, prompt, designSystem, concept, repairContext) => {
  const ds = DS_CONFIG[designSystem] || DS_CONFIG.material;
  const typeCtx = TYPE_CONTEXT[projectType] || TYPE_CONTEXT.dashboard;
  const conceptBlock = formatConceptForPrompt(concept);

  const repairBlock = repairContext
    ? `

YOUR PREVIOUS ATTEMPT FAILED THE PARSER. Here is the parse error you must fix:
"${repairContext.error}"

A common cause: using JSX-attribute syntax (\`name={value}\`) inside an object literal — use \`name: value\` there. Re-emit the FULL component from scratch with this fixed. Do not abbreviate.

`
    : '';

  return `Generate a complete React component for a ${typeCtx}.${repairBlock}

USER DESCRIPTION: ${prompt}
DESIGN SYSTEM: ${ds.name}
COMPONENT STYLE GUIDE: ${ds.style}${conceptBlock}

STRICT RULES:
- Import React (with useState) from 'react' and all UI components from '${ds.pkg}' only
- Export a single default function named GeneratedApp
- Layout MUST include: top header with the product name + a primary action button + an avatar, a sidebar nav (one item per feature in the brief), and a main content area that swaps based on the selected nav item
- Wrap in the library's required Provider (ConfigProvider / ChakraProvider / MantineProvider / ThemeProvider / Theme)
- Use height: '100vh', width: '100%', overflow: 'hidden' on the root element so it fills its container
- Sample data MUST relate to the brief's audience and feature set — pick realistic row data for the product domain
- Use the library's badge/tag/chip component with color variants for any status fields (green=active/success, blue=lead/in-progress, orange=pending, gray=closed/inactive)

INTERACTIVITY (REQUIRED):
- Use useState for selected sidebar nav item — clicking a nav item must update the active selection visually
- Clicking a nav item MUST also swap the main content area, not just the highlight. Define a content map keyed by feature/nav id; render the fragment for the currently-selected nav. Each feature's section must have visibly different content matching that feature's purpose (a different heading + short supporting widget — small list, short table 2-3 rows, a form, or a couple of cards).
- KEEP SECTIONS COMPACT: the FIRST feature (default selected) gets the full dashboard layout — KPI cards in a row + one ~4-row data table. Other features render a SHORT section: a Heading + ONE small widget (single list, short table with ≤3 rows, or a placeholder card). Do NOT duplicate the full dashboard per section. Favor brevity over breadth so the output fits.
- The "+ New" / action button in the header must open a simple alert or toggle a piece of useState (e.g. show a small inline message)
- The status badges/tags/chips in the table rows should be rendered from row data (not hardcoded JSX)

RESPONSIVENESS (REQUIRED):
- The layout MUST adapt to narrow viewports. At < 600px wide: collapse the sidebar (hide it or make it horizontal/icon-only), and stack the 3 stat cards vertically.
- For Material UI v9: use Grid props directly like \`<Grid xs={12} sm={6} md={4}>\` (NO \`item\` prop, that's v5); conditionally render sidebar based on useMediaQuery('(min-width:600px)')
- For Ant Design: use Row/Col with xs={24} sm={12} md={8} on stat cards; use Layout's responsive Sider with breakpoint="md" collapsedWidth={0}
- For Chakra UI: use SimpleGrid columns={{ base: 1, md: 3 }} for stat cards; use useBreakpointValue or Show/Hide for sidebar
- For Mantine: use SimpleGrid cols={{ base: 1, sm: 3 }} for stat cards; use useMediaQuery hook from @mantine/hooks for sidebar
- For Carbon: use Grid + Column with sm={4} md={2} lg={5} responsive props
- The data table must be horizontally scrollable on narrow widths (use overflow-x: auto wrapper, or library's responsive table prop)

OTHER RULES:
- No TypeScript, no comments
- CSS imports for the library (e.g. @mantine/core/styles.css, @carbon/styles/css/styles.css) are handled by the host environment — do NOT import them yourself
- DO NOT import any icon package (no @ant-design/icons, @mui/icons-material, @carbon/icons-react, @chakra-ui/icons, @tabler/icons-react). Use plain text labels or unicode glyphs (•, →, ↓, ✓, ☰) instead. This is a hard requirement.

SYNTAX HARD RULES (your output is parsed by a strict JSX parser — these errors break everything):
- NEVER use JSX-attribute syntax (\`name={value}\`) inside an object literal. Inside object literals, use object-property syntax: \`name: value\`. WRONG: \`{ variant: 'body2', sx={{ fontWeight: 600 }} }\`. RIGHT: \`{ variant: 'body2', sx: { fontWeight: 600 } }\`. This applies to MUI nested-props like primaryTypographyProps, slotProps, and componentsProps.
- Object literals use commas between properties, not semicolons or JSX-style attributes.
- Make sure every JSX tag opens and closes correctly. If you start \`<Layout>\`, you must close \`</Layout>\` at the matching depth.
- Output must be syntactically valid React/JSX that parses with @babel/standalone preset-react.

Return ONLY the JSX/JS code starting with import statements.`;
};

const callClaudeForCode = async (userPrompt) => {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    system:
      'You are an expert React developer. You write clean, complete, working, INTERACTIVE and RESPONSIVE React components. You always return raw code only — no markdown fences, no explanations, nothing before the first import statement. Your output is parsed by @babel/parser with the JSX plugin and any syntax error means the entire app fails to render.',
    messages: [{ role: 'user', content: userPrompt }],
  });
  return stripFences(message.content[0].text);
};

const MAX_CODE_ATTEMPTS = 3;

export async function generateComponentCode(projectType, prompt, designSystem, concept) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
    const repairContext = lastError ? { error: lastError } : null;
    const userPrompt = buildUserPromptForCode(projectType, prompt, designSystem, concept, repairContext);

    let code;
    try {
      code = await callClaudeForCode(userPrompt);
    } catch (err) {
      console.error(`[AI] Claude call failed (attempt ${attempt}):`, err.message);
      throw err;
    }

    const validation = validateJsx(code);
    if (validation.ok) {
      if (attempt > 1) console.log(`[AI] Code valid on attempt ${attempt}`);
      return code;
    }
    console.warn(`[AI] Code parse failed (attempt ${attempt}/${MAX_CODE_ATTEMPTS}): ${validation.error}`);
    lastError = validation.error;
  }
  const err = new Error(
    `Generated code did not parse after ${MAX_CODE_ATTEMPTS} attempts. Last parser error: ${lastError}`,
  );
  err.code = 'CODE_PARSE_FAILED';
  throw err;
}

const CONCEPT_SYSTEM = `You are a senior B2B product strategist. Given a rough idea or business prompt from a founder/PM/designer, produce a sharp, opinionated product concept brief in strict JSON. No commentary, no markdown fences — only the JSON object.

The brief must be specific, not generic. Pick a credible product name, write a tagline that could be on the homepage, name 2-3 distinct user personas with their actual pain points, choose 5-7 features that solve those pain points, articulate one clear value proposition, and pick 4-5 KPIs that the team would track.`;

const CONCEPT_SCHEMA_HINT = `Return JSON in exactly this shape:
{
  "name": "string — the product's name",
  "tagline": "string — one sentence, homepage-ready",
  "description": "string — 2-3 sentences explaining what the product does and for whom",
  "audience": [
    { "role": "string — job title or persona name", "painPoint": "string — the specific friction this person feels today" }
  ],
  "features": [
    { "name": "string — short feature name", "rationale": "string — one sentence on why this feature matters / which pain point it addresses" }
  ],
  "valueProposition": {
    "headline": "string — the central promise of the product, one tight sentence",
    "supports": ["string — supporting bullet 1", "string — supporting bullet 2", "string — supporting bullet 3"]
  },
  "kpis": [
    { "metric": "string — the metric name", "why": "string — why this metric reflects success" }
  ]
}`;

export async function generateConcept(prompt, projectType) {
  const typeHint = TYPE_CONTEXT[projectType] || TYPE_CONTEXT.dashboard;

  const message = await client.messages.create({
    // Using haiku-4-5 here (same as code generation) so a key with haiku-only
    // access can still produce briefs. If your key has sonnet access, swap to
    // 'claude-sonnet-4-6' for richer strategic output.
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: CONCEPT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `IDEA: ${prompt}

PRODUCT CATEGORY HINT: ${typeHint}

${CONCEPT_SCHEMA_HINT}

Return only the JSON object. Do not include markdown fences, explanations, or anything before or after the JSON.`,
      },
    ],
  });

  const raw = message.content[0].text;
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const e = new Error('Concept generation returned invalid JSON');
    e.cause = err;
    e.raw = raw;
    throw e;
  }
}
