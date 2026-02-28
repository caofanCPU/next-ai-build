import { copy, readJson, writeJson, remove, ensureDir, pathExists, rename, writeFile } from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

export async function createDiaomaoApp(targetDir: string) {
  if (!targetDir) {
    console.error('Usage: create-diaomao-app <project-name>');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  const cwdPackageJson = path.join(cwd, 'package.json');
  const cwdWorkspaceYaml = path.join(cwd, 'pnpm-workspace.yaml');
  
  // detect current directory type
  const hasPkgJson = await pathExists(cwdPackageJson);
  const hasWorkspace = await pathExists(cwdWorkspaceYaml);
  
  let destDir: string;
  
  if (hasPkgJson && hasWorkspace) {
    // monorepo scenario - create under apps/
    console.error('Detected monorepo environment, NextJS DO NOT SUPPORT MONOREPO WELL!');
    process.exit(1);
  } else if (hasPkgJson && !hasWorkspace) {
    // wrong directory - user might be inside an existing project
    console.error('Warning: You are in a directory that already contains package.json');
    console.error('This might create a nested project structure which is usually not intended.');
    console.error('');
    console.error('Recommendations:');
    console.error('- If you want to create a standalone project, run this command in an empty directory');
    console.error('- If you want to add to a monorepo, run this command in the monorepo root');
    console.error('');
    
    // for now, let's exit with error - can be enhanced to ask for user confirmation
    process.exit(1);
  } else {
    // normal scenario - create in current directory
    destDir = path.resolve(cwd, targetDir);
  }

  const tempDir = path.join(os.tmpdir(), `diaomao-template-${Date.now()}`);

  console.log(`Creating project: ${targetDir}...`);
  
  try {
    // create temp dir
    await ensureDir(tempDir);
    
    // download diaomao package from npm
    console.log('Downloading diaomao template from npm...');
    execSync(`npm pack @windrun-huaiin/diaomao`, { cwd: tempDir, stdio: 'inherit' });
    
    // unzip npm package
    const packageFiles = execSync('ls *.tgz', { cwd: tempDir, encoding: 'utf8' }).trim().split('\n');
    const packageFile = packageFiles[0];
    execSync(`tar -xzf ${packageFile}`, { cwd: tempDir });
    
    // copy template content (npm package unzip in package/ directory)
    const templateDir = path.join(tempDir, 'package');
    await copy(templateDir, destDir, { overwrite: true });
    
    // rename .env.local.txt to .env.local
    const envTxtPath = path.join(destDir, '.env.local.txt');
    const envPath = path.join(destDir, '.env.local');
    if (await pathExists(envTxtPath)) {
      await rename(envTxtPath, envPath);
      console.log('Renamed .env.local.txt to .env.local');
    }
    
    // handle .changeset folder if exists
    const changesetDir = path.join(destDir, '.changeset');
    if (await pathExists(changesetDir)) {
      const templateFile = path.join(changesetDir, 'd8-template.mdx');
      const changesetContent = `---\n"${path.basename(targetDir)}": major\n---\n\nfeat(init): app created by @windrun-huaiin/diaomao`;
      await writeFile(templateFile, changesetContent, 'utf8');
      console.log('Created changeset template file: d8-template.mdx');
    }

    // read and modify package.json
    const pkgPath = path.join(destDir, 'package.json');
    const pkg = await readJson(pkgPath);
    pkg.name = path.basename(targetDir);
    pkg.version = "1.0.0";
    pkg.private = true;

    // remove standalone-specific scripts for non-monorepo scenario
    if (pkg.scripts) {
      delete pkg.scripts['djvp'];
    }

    // remove publish related config
    delete pkg.publishConfig;
    if (pkg.files) delete pkg.files;
    await writeJson(pkgPath, pkg, { spaces: 2 });

    console.log('Installing dependencies...');
      
      // auto install dependencies
      try {
        execSync('pnpm install', { cwd: destDir, stdio: 'inherit' });
      } catch (error) {
        console.warn('pnpm failed, trying npm...');
        try {
          execSync('npm install', { cwd: destDir, stdio: 'inherit' });
        } catch (npmError) {
          console.error('Failed to install dependencies. Please run npm install or pnpm install manually.');
        }
      }

      console.log('Initializing Git repository...');
      
      // initialize git
      try {
        execSync('git init', { cwd: destDir, stdio: 'inherit' });
        execSync('git add .', { cwd: destDir, stdio: 'inherit' });
        execSync('git commit -m "feat: initial commit from diaomao template"', { cwd: destDir, stdio: 'inherit' });
      } catch (error) {
        console.warn('Failed to initialize Git repository. Please initialize manually.');
      }

    console.log(`\n✅ Project created: ${destDir}`);
    console.log(`\nNext steps:`);
    
    console.log(`  cd ${targetDir}`);
    console.log(`  pnpm build`);
    console.log(`  pnpm dev`);
    console.log(`  NOTE: if you want to update @windrun-huaiin packages, please run pnpm windrun`);
    console.log(`  NOTE: please check .env.local file and set your own env!`);
  } catch (error) {
    console.error('Failed to create project:', error);
    process.exit(1);
  } finally {
    // cleanup temp dir
    try {
      await remove(tempDir);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary directory:', tempDir);
    }
  }
} 