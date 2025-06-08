require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');

// Banner
console.log(chalk.cyan(figlet.textSync('Pharos auto send made: by mooe', { horizontalLayout: 'full' })));
console.log(chalk.green(`Bot Auto-TX ke Random Address | Max 25 TX / Hari\n`));

// Provider & Wallet
const provider = new ethers.JsonRpcProvider('https://testnet.dplabs-internal.com', {
  name: 'pharos-testnet',
  chainId: 688688,
});
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// File counter
const counterFile = path.join(__dirname, 'txcount.json');
let txData = { date: '', count: 0 };

// Utilitas
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
    saveCounter();
    console.log(chalk.yellow(`\n🎯 Hari baru terdeteksi, counter direset.\n`));
  }
}

function generateRandomAddress() {
  return ethers.Wallet.createRandom().address;
}

// Fungsi Kirim
async function sendToRandomAddress() {
  loadCounter();
  resetIfNewDay();

  if (txData.count >= 25) {
    console.log(chalk.red.bold('\n🚫 Batas 25 transaksi per hari telah tercapai. Bot dihentikan.\n'));
    process.exit(0);
  }

  try {
    const to = generateRandomAddress();
    const tx = await wallet.sendTransaction({
      to: to,
      value: ethers.parseEther('0.0001'),
    });

    console.log(chalk.blue(`🚀 TX #${txData.count + 1} terkirim ke:`), chalk.magenta(to));
    console.log(chalk.gray(`   TX Hash:`), chalk.white(tx.hash));
    const receipt = await tx.wait();
    console.log(chalk.green(`   ✅ Berhasil di blok ${receipt.blockNumber}\n`));

    txData.count += 1;
    saveCounter();

  } catch (err) {
    console.error(chalk.red(`❌ Gagal mengirim TX: ${err.message}\n`));
  }
}

// Loop setiap 15 detik
setInterval(() => {
  sendToRandomAddress();
}, 15000);
