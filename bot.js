import dotenv from 'dotenv';
import { JsonRpcProvider, Wallet, parseEther } from 'ethers';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figlet from 'figlet';

dotenv.config();

// Banner sekali saat start
console.log(chalk.cyan('Pharos Bot'));
console.log(chalk.green(`Bot Auto-TX ke Random Address | Max 25 TX / Hari\n made by mooe\n`));

// Provider & Wallet
const provider = new JsonRpcProvider('https://testnet.dplabs-internal.com', {
  name: 'pharos-testnet',
  chainId: 688688,
});
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

// File dan data counter
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const counterFile = path.join(__dirname, 'txcount.json');
let txData = { date: '', count: 0 };
let isDailyLimitReached = false;

// Fungsi load/save/reset counter
function loadCounter() {
  if (fs.existsSync(counterFile)) {
    const raw = fs.readFileSync(counterFile);
    txData = JSON.parse(raw);
  }
}

function saveCounter() {
  fs.writeFileSync(counterFile, JSON.stringify(txData, null, 2));
}

function resetIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (txData.date !== today) {
    txData.date = today;
    txData.count = 0;
    isDailyLimitReached = false;
    saveCounter();
    console.log(chalk.yellow(`\n🔄 Hari baru dimulai, counter direset ke 0\n`));
  }
}

// Alamat acak
function generateRandomAddress() {
  return Wallet.createRandom().address;
}

// Kirim transaksi jika belum limit
async function sendToRandomAddress() {
  loadCounter();
  resetIfNewDay();

  if (txData.count >= 25) {
    if (!isDailyLimitReached) {
      console.log(chalk.red.bold(`\n🚫 Batas 25 transaksi tercapai untuk hari ini. Menunggu hari berikutnya...\n`));
      isDailyLimitReached = true;
    }
    return;
  }

  try {
    const to = generateRandomAddress();
    const tx = await wallet.sendTransaction({
      to: to,
      value: parseEther('0.0001'),
    });

    console.log(chalk.blue(`🚀 TX #${txData.count + 1} terkirim ke:`), chalk.magenta(to));
    console.log(chalk.gray(`   TX Hash:`), chalk.white(tx.hash));
    const receipt = await tx.wait();
    console.log(chalk.green(`   ✅ Sukses di blok ${receipt.blockNumber}\n`));

    txData.count += 1;
    saveCounter();

  } catch (err) {
    console.error(chalk.red(`❌ Gagal mengirim TX: ${err.message}\n`));
  }
}

// Loop interval 15 detik
setInterval(sendToRandomAddress, 15000);
