#!/usr/bin/env bun
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const OUTPUT_DIR = join(__dirname, '..', 'dest');

interface TemplateMapping {
    template: string;
    output: string;
}

const TEMPLATE_MAPPINGS: TemplateMapping[] = [
    { template: 'index.mjs', output: 'index.mjs' },
    { template: 'index.cjs', output: 'index.cjs' },
    { template: 'index.d.ts', output: 'index.d.ts' },
];

const variables: Record<string, string> = {
    DATE: new Date().toISOString().split('T')[0],
};

function renderTemplate(content: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
        (rendered, [key, value]) => rendered.replaceAll(`{{${key}}}`, value),
        content,
    );
}

async function processTemplate(templateFile: string, outputFile: string): Promise<void> {
    const templatePath = join(TEMPLATES_DIR, templateFile);
    const outputPath = join(OUTPUT_DIR, outputFile);

    const templateContent = await readFile(templatePath, 'utf8');
    const renderedContent = renderTemplate(templateContent, variables);
    await writeFile(outputPath, renderedContent, 'utf8');
    console.log(`✓ Rendered ${templateFile} → ${outputFile}`);
}

try {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log('Rendering templates...');
    console.log(`Variables:`, variables);
    console.log('');

    await Promise.all(
        TEMPLATE_MAPPINGS.map(({ template, output }) => processTemplate(template, output)),
    );

    console.log('');
    console.log('✓ All templates rendered successfully!');
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${message}`);
    process.exit(1);
}

