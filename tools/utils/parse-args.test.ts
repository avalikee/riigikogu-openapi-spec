import { test } from 'node:test';
import assert from 'node:assert';
import { parseArgs } from './parse-args.js';

test('parseArgs - basic arguments', () => {
    const args = ['--key1', 'value1', '--key2', 'value2'];
    const result = parseArgs(args);

    assert.strictEqual(result.get('key1'), 'value1');
    assert.strictEqual(result.get('key2'), 'value2');
    assert.strictEqual(result.size, 2);
});

test('parseArgs - single argument', () => {
    const args = ['--key', 'value'];
    const result = parseArgs(args);

    assert.strictEqual(result.get('key'), 'value');
    assert.strictEqual(result.size, 1);
});

test('parseArgs - empty array', () => {
    const args: string[] = [];
    const result = parseArgs(args);

    assert.strictEqual(result.size, 0);
});

test('parseArgs - boolean flag support (no value)', () => {
    const args = ['--key1', 'value1', '--flag'];
    const result = parseArgs(args);

    assert.strictEqual(result.get('key1'), 'value1');
    assert.strictEqual(result.get('flag'), 'true');
    assert.strictEqual(result.size, 2);
});

test('parseArgs - arguments without -- prefix', () => {
    const args = ['key1', 'value1'];
    const result = parseArgs(args);

    assert.strictEqual(result.get('key1'), 'value1');
    assert.strictEqual(result.size, 1);
});

test('parseArgs - mixed with and without prefix', () => {
    const args = ['--key1', 'value1', 'key2', 'value2'];
    const result = parseArgs(args);

    assert.strictEqual(result.get('key1'), 'value1');
    assert.strictEqual(result.get('key2'), 'value2');
    assert.strictEqual(result.size, 2);
});

