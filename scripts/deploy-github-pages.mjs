#!/usr/bin/env node
/*
 * 一键部署张旭个人站到 GitHub Pages
 * 网址：https://zhaosenlin-bit.github.io/zhangxu____web/
 * 用法：node scripts/deploy-github-pages.mjs [--dry-run]
 * 说明：以 /zhangxu____web/ 为 base 重新构建，重写硬编码路径，推送到 gh-pages 分支。
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const BASE = '/zhangxu____web/';
const GH_REMOTE = 'https://github.com/zhaosenlin-bit/zhangxu____web.git';
const GH_BRANCH = 'gh-pages';
const PUBLIC_URL = 'https://zhaosenlin-bit.github.io/zhangxu____web/';

const run = (cmd, opts = {}) => {
  console.log('$ ' + cmd);
  return execSync(cmd, { stdio: 'inherit', cwd: repoRoot, shell: 'cmd.exe', ...opts });
};

// 1) 构建（base 指向 GitHub Pages 项目路径）
run('npm.cmd run build -- --base=' + BASE);

// 2) 把源码里硬编码的 /cartoon/ 资源路径重写为 /zhangxu____web/
const distRoot = path.join(repoRoot, 'dist', 'cartoon');
if (!existsSync(distRoot)) {
  console.error('dist/cartoon 不存在，构建似乎失败了');
  process.exit(1);
}
let rewrittenFiles = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(js|css|html|json|svg|txt)$/i.test(name)) continue;
    if (name === '_headers' || name === '_redirects') continue;
    const c = readFileSync(p, 'utf8');
    if (c.includes('/cartoon/')) {
      writeFileSync(p, c.split('/cartoon/').join('/zhangxu____web/'), 'utf8');
      rewrittenFiles++;
    }
  }
};
walk(distRoot);
console.log('路径重写文件数：' + rewrittenFiles);

// 3) 组装发布目录（排除 .gz、_headers、_redirects，添加 404.html 与 .nojekyll）
const deployDir = mkdtempSync(path.join(tmpdir(), 'zhangxu-ghpages-'));
const copyFilter = (src) => {
  const base = path.basename(src);
  if (base === '_headers' || base === '_redirects') return false;
  if (base.endsWith('.gz')) return false;
  return true;
};
cpSync(distRoot, deployDir, { recursive: true, filter: copyFilter });
writeFileSync(path.join(deployDir, '404.html'), readFileSync(path.join(distRoot, 'index.html'), 'utf8'), 'utf8');
writeFileSync(path.join(deployDir, '.nojekyll'), '');
console.log('组装目录：' + deployDir);
console.log('顶层内容：' + readdirSync(deployDir).join(', '));

if (dryRun) {
  console.log('dry-run：仅组装，不推送。');
  process.exit(0);
}

// 4) 推送到 gh-pages（强制覆盖）
const git = (args) => {
  const cmd = 'git ' + args.map((a) => (/[\s()\"]/.test(a) ? '\"' + a.replace(/\"/g, '\\\"') + '\"' : a)).join(' ');
  console.log('$ ' + cmd);
  return execSync(cmd, { stdio: 'inherit', cwd: deployDir, shell: 'cmd.exe' });
};
git(['init']);
git(['symbolic-ref', 'HEAD', 'refs/heads/' + GH_BRANCH]);
git(['config', 'user.name', 'zhaosenlin-bit']);
git(['config', 'user.email', 'zhaosenlin-bit@users.noreply.github.com']);
git(['add', '-A']);
git(['commit', '-m', 'Deploy ZhangXu site to GitHub Pages (latest incl. vocab game)']);
git(['remote', 'add', 'origin', GH_REMOTE]);
git(['push', 'origin', GH_BRANCH, '--force']);
console.log('部署完成：' + PUBLIC_URL);