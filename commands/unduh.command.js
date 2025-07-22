const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const db = require('../models');

const moment = require('moment');
require('moment/locale/id');
moment.locale('id'); // agar "Juni", "Februari" dll dikenali

const borderProperties = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
};

/**
 * Fungsi untuk menentukan sesi jam kerja berdasarkan waktu kegiatan.
 * @param {moment.Moment} dateTime - Objek moment dari waktu kegiatan.
 * @returns {string} - String rentang waktu sesi atau waktu asli jika di luar jam kerja.
 */
function getSesiJamKerja(dateTime) {
  const day = dateTime.day(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const time = dateTime.clone();

  // Senin - Kamis (day 1 sampai 4)
  if (day >= 1 && day <= 4) {
    const startMorning = time.clone().set({ hour: 7, minute: 30, second: 0 });
    const endMorning = time.clone().set({ hour: 12, minute: 0, second: 0 });
    const startAfternoon = time.clone().set({ hour: 13, minute: 0, second: 0 });
    const endAfternoon = time.clone().set({ hour: 16, minute: 0, second: 0 });

    if (time.isBetween(startMorning, endMorning, null, '[]')) {
      return '07:30 s.d 12:00';
    }
    if (time.isBetween(startAfternoon, endAfternoon, null, '[]')) {
      return '13:00 s.d 16:00';
    }
  }

  // Jumat (day 5)
  if (day === 5) {
    const startMorning = time.clone().set({ hour: 7, minute: 30, second: 0 });
    const endMorning = time.clone().set({ hour: 11, minute: 30, second: 0 });
    const startAfternoon = time.clone().set({ hour: 13, minute: 0, second: 0 });
    const endAfternoon = time.clone().set({ hour: 16, minute: 30, second: 0 });

    if (time.isBetween(startMorning, endMorning, null, '[]')) {
      return '07:30 s.d 11:30';
    }
    if (time.isBetween(startAfternoon, endAfternoon, null, '[]')) {
      return '13:00 s.d 16:30';
    }
  }

  // Default: di luar jam kerja, kembalikan waktu asli
  return dateTime.format('HH:mm');
}


module.exports = (bot) => {
  bot.onText(/\/unduh(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const arg = match[1];
    const username = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ''}`;

    let bulan, tahun;

    if (arg) {
      const parsed = moment(arg, 'MMMM YYYY', true);
      if (!parsed.isValid()) {
        return bot.sendMessage(chatId, '❌ Format salah. Gunakan contoh: `/unduh Juni 2025`', { parse_mode: 'Markdown' });
      }
      bulan = parsed.month();
      tahun = parsed.year();
    } else {
      bulan = moment().month();
      tahun = moment().year();
    }

    try {
      // --- Pengambilan Data (Tidak Berubah) ---
      const whereClause = { user_id: userId };
      if (bulan !== null && tahun !== null) {
        const awalBulan = moment({ year: tahun, month: bulan, day: 1 }).startOf('month').toDate();
        const akhirBulan = moment({ year: tahun, month: bulan, day: 1 }).endOf('month').toDate();
        whereClause.createdAt = { [db.Sequelize.Op.between]: [awalBulan, akhirBulan] };
      }
      const userProfile = await db.UserProfile.findByPk(userId);
      const laporan = await db.Laporan.findAll({ where: whereClause, order: [['createdAt', 'ASC']] });

      if (!laporan.length) {
        return bot.sendMessage(chatId, '📭 Tidak ada laporan ditemukan untuk periode tersebut.');
      }

      // --- Pembuatan Excel ---
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan');

      // --- Penulisan Header (Tidak Berubah) ---
      worksheet.mergeCells('A1:H1');
      worksheet.getCell('A1').value = 'LAPORAN HARIAN / PENILAIAN PRODUKTIVITAS KERJA';
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').font = { bold: true, size: 12, name: 'Cambria' };
      worksheet.getCell('A1').border = borderProperties;
      worksheet.getRow(1).height = 40;

      const nama = userProfile?.nama || '';
      const nip = userProfile?.nip || '';
      const jabatan = userProfile?.jabatan || '';
      const unitKerja = userProfile?.unit_kerja || '';

      worksheet.getCell('A2').value = 'NAMA'; worksheet.mergeCells('B2:H2'); worksheet.getCell('B2').value = nama || username;
      worksheet.getCell('A3').value = 'NIP'; worksheet.mergeCells('B3:H3'); worksheet.getCell('B3').value = nip;
      worksheet.getCell('A4').value = 'JABATAN'; worksheet.mergeCells('B4:H4'); worksheet.getCell('B4').value = jabatan;
      worksheet.getCell('A5').value = 'UNIT KERJA'; worksheet.mergeCells('B5:H5'); worksheet.getCell('B5').value = unitKerja || 'Dinas Komunikasi, Informatika, Statistik Dan Persandian Kab. Buol';
      [2, 3, 4, 5].forEach(rowNum => {
        worksheet.getRow(rowNum).font = { size: 10, name: 'Cambria' };
        worksheet.getRow(rowNum).eachCell(cell => { cell.border = borderProperties; });
      });
      worksheet.getCell('B2').font = { bold: true, size: 10, name: 'Cambria' };


      worksheet.addRow(['Hari / Tanggal', 'No', 'Jam', 'Uraian Kegiatan Harian', 'Hasil / Output', 'Nilai Capaian Indikator Kinerja (%)', 'Nilai Produktivitas Harian', 'Paraf Pejabat Penilai']);
      worksheet.getColumn(1).width = 25; worksheet.getColumn(2).width = 5; worksheet.getColumn(3).width = 15; worksheet.getColumn(4).width = 80; worksheet.getColumn(5).width = 15; worksheet.getColumn(6).width = 15; worksheet.getColumn(7).width = 15; worksheet.getColumn(8).width = 25;
      const headerRow = worksheet.getRow(6);
      headerRow.height = 60;
      headerRow.eachCell((cell) => { cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.font = { size: 11, name: 'Cambria' }; cell.border = borderProperties; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } }; });
      worksheet.addRow([1, 2, 3, 4, 5, 6, 7, 8]);
      const numberRow = worksheet.getRow(7);
      numberRow.eachCell((cell) => { cell.font = { name: 'Cambria', size: 8, italic: true, bold: true }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = borderProperties; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; });

      // ==========================================================
      // BAGIAN UTAMA: PENGELOMPOKAN DAN PENULISAN DATA
      // ==========================================================

      // Langkah 1: Kelompokkan data berdasarkan tanggal, lalu sesi jam
      const groupedData = {};
      laporan.forEach(lapor => {
        const dateKey = moment(lapor.createdAt).format('YYYY-MM-DD');
        const jamSesi = getSesiJamKerja(moment(lapor.createdAt));
        if (!groupedData[dateKey]) groupedData[dateKey] = {};
        if (!groupedData[dateKey][jamSesi]) groupedData[dateKey][jamSesi] = [];
        groupedData[dateKey][jamSesi].push(lapor);
      });

      // Langkah 2: Tulis data yang sudah dikelompokkan ke sheet
      for (const dateKey of Object.keys(groupedData)) {
        const dailyActivities = groupedData[dateKey];
        const dateStartRow = worksheet.lastRow.number + 1;
        let dailyCounter = 1;
        const tanggalFormatted = moment(dateKey).format('dddd, DD MMMM YYYY');

        for (const jamSesi of Object.keys(dailyActivities)) {
          const sessionActivities = dailyActivities[jamSesi];
          const sessionStartRow = worksheet.lastRow.number + 1;

          for (const lapor of sessionActivities) {
            const dataRow = worksheet.addRow([
              tanggalFormatted.charAt(0).toUpperCase() + tanggalFormatted.slice(1),
              dailyCounter,
              jamSesi,
              lapor.deskripsi_ai ?? lapor.deskripsi,
              '', '', '', ''
            ]);
            dataRow.eachCell((cell, colNumber) => {
              cell.font = { size: 10, name: 'Cambria' };
              cell.border = borderProperties;
              cell.alignment = [1, 2, 3].includes(colNumber) ? { vertical: 'middle', horizontal: 'center', wrapText: true } : { vertical: 'top', wrapText: true };
            });
            dailyCounter++;
          }

          // Gabungkan sel 'Jam' (Kolom C) untuk sesi ini
          if (sessionActivities.length > 1) {
            worksheet.mergeCells(`C${sessionStartRow}:C${worksheet.lastRow.number}`);
            worksheet.getCell(`C${sessionStartRow}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          }
        }

        // Tambah baris ringkasan di akhir setiap hari
        const summaryRow = worksheet.addRow(['', '', '', '', '', '', '', '']);
        const summaryRowIndex = summaryRow.number;
        worksheet.mergeCells(`B${summaryRowIndex}:E${summaryRowIndex}`);
        const summaryCell = worksheet.getCell(`B${summaryRowIndex}`);
        summaryCell.value = 'Nilai Capaian Indikator Kinerja Rata-Rata per hari';
        summaryCell.font = { name: 'Cambria', italic: true, size: 10 };
        summaryCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ['B', 'C', 'D', 'E', 'F'].forEach(col => {
          const cell = worksheet.getCell(`${col}${summaryRowIndex}`);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
          cell.border = borderProperties;
        });
        worksheet.getCell(`F${summaryRowIndex}`).alignment = { horizontal: 'center', vertical: 'middle' };


        // Gabungkan sel 'Hari/Tanggal' (A), 'Nilai' (G), dan 'Paraf' (H) untuk seluruh hari
        const dateEndRow = summaryRowIndex;
        worksheet.mergeCells(`A${dateStartRow}:A${dateEndRow}`);
        worksheet.mergeCells(`G${dateStartRow}:G${dateEndRow}`);
        worksheet.mergeCells(`H${dateStartRow}:H${dateEndRow}`);
        ['A', 'G', 'H'].forEach(col => {
          worksheet.getCell(`${col}${dateStartRow}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });
      }

      // ==========================================================
      // BAGIAN SHEET DETAIL (DIPERBARUI)
      // ==========================================================
      const worksheetDetail = workbook.addWorksheet('Detail');

      // Header baru
      worksheetDetail.addRow(['Tanggal', 'Jam', 'Deskripsi Asli', 'Deskripsi AI', 'Foto Dokumentasi']);
      const headerRowDetail = worksheetDetail.getRow(1);
      headerRowDetail.font = { bold: true, name: 'Cambria', size: 11 };
      headerRowDetail.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRowDetail.eachCell((cell) => {
        cell.border = borderProperties;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } };
      });

      // Lebar kolom baru
      worksheetDetail.getColumn(1).width = 25; // Tanggal
      worksheetDetail.getColumn(2).width = 10; // Jam
      worksheetDetail.getColumn(3).width = 60; // Deskripsi Asli
      worksheetDetail.getColumn(4).width = 60; // Deskripsi AI
      worksheetDetail.getColumn(5).width = 40; // Foto

      // Tulis semua laporan ke sheet Detail
      for (const lapor of laporan) {
        const tanggal = moment(lapor.createdAt).format('dddd, DD MMMM YYYY');
        const jam = moment(lapor.createdAt).format('HH:mm');

        const rowData = [
          tanggal.charAt(0).toUpperCase() + tanggal.slice(1),
          jam,
          lapor.deskripsi,
          lapor.deskripsi_ai || '-', // Tampilkan '-' jika deskripsi AI null
          lapor.foto ? { text: lapor.foto, hyperlink: `${process.env.STORAGE_URL}/${lapor.foto}` } : '-' // Buat link jika ada foto, jika tidak tampilkan '-'
        ];

        const detailRow = worksheetDetail.addRow(rowData);

        detailRow.eachCell((cell, colNumber) => {
          cell.border = borderProperties;
          cell.font = { name: 'Cambria', size: 10 };

          // Atur alignment
          if ([1, 2, 5].includes(colNumber)) { // Tanggal, Jam, Foto
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          } else { // Deskripsi Asli, Deskripsi AI
            cell.alignment = { vertical: 'top', wrapText: true };
          }

          // Atur style khusus untuk link foto
          if (colNumber === 5 && lapor.foto) {
            cell.font = { name: 'Cambria', size: 10, italic: true, underline: true, color: { argb: 'FF0000FF' } };
          }
        });
      }

      // --- Penyimpanan File (Tidak Berubah) ---
      const namaBulan = bulan !== null ? moment().month(bulan).format('MMMM') : '';
      const namaFile = `laporan_${userId}_${namaBulan}_${tahun || 'semua'}.xlsx`;
      const filepath = path.join(__dirname, '..', namaFile);

      await workbook.xlsx.writeFile(filepath);
      await bot.sendDocument(chatId, filepath);
      fs.unlinkSync(filepath);
    } catch (err) {
      console.error('❌ Gagal unduh laporan:', err);
      bot.sendMessage(chatId, '❌ Gagal mengunduh laporan.');
    }
  });
};
