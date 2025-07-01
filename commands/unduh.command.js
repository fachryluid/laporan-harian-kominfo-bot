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

module.exports = (bot) => {
  bot.onText(/\/unduh(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const arg = match[1];
    const username = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ''}`;

    let bulan = null;
    let tahun = null;

    if (arg) {
      const parsed = moment(arg, 'MMMM YYYY', true);
      if (!parsed.isValid()) {
        return bot.sendMessage(chatId, '❌ Format salah. Gunakan contoh: `/unduh Juni 2025`', { parse_mode: 'Markdown' });
      }
      bulan = parsed.month(); // 0 = Januari
      tahun = parsed.year();
    }

    try {
      const whereClause = { user_id: userId };

      if (bulan !== null && tahun !== null) {
        const awalBulan = moment({ year: tahun, month: bulan, day: 1 }).startOf('month').toDate();
        const akhirBulan = moment({ year: tahun, month: bulan, day: 1 }).endOf('month').toDate();

        whereClause.createdAt = {
          [db.Sequelize.Op.between]: [awalBulan, akhirBulan]
        };
      }

      const userProfile = await db.UserProfile.findByPk(userId);
      const nama = userProfile?.nama || '';
      const nip = userProfile?.nip || '';
      const jabatan = userProfile?.jabatan || '';
      const unitKerja = userProfile?.unit_kerja || '';

      const laporan = await db.Laporan.findAll({
        where: whereClause,
        order: [['createdAt', 'ASC']],
      });

      if (!laporan.length) {
        return bot.sendMessage(chatId, '📭 Tidak ada laporan ditemukan untuk periode tersebut.');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan');

      // baris ke-1
      worksheet.mergeCells('A1:H1');
      worksheet.getCell('A1').value = 'LAPORAN HARIAN / PENILAIAN PRODUKTIVITAS KERJA';
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').font = { bold: true, size: 12, name: 'Cambria' };
      worksheet.getCell('A1').border = borderProperties;
      worksheet.getRow(1).height = 40;

      // baris ke-2
      worksheet.getCell('A2').value = 'NAMA';
      worksheet.getCell('A2').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('A2').border = borderProperties;
      worksheet.mergeCells('B2:H2');
      worksheet.getCell('B2').value = nama || username;
      worksheet.getCell('B2').font = { bold: true, size: 10, name: 'Cambria' };
      worksheet.getCell('B2').border = borderProperties;

      // baris ke-3
      worksheet.getCell('A3').value = 'NIP';
      worksheet.getCell('A3').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('A3').border = borderProperties;
      worksheet.mergeCells('B3:H3');
      worksheet.getCell('B3').value = nip;
      worksheet.getCell('B3').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('B3').border = borderProperties;

      // baris ke-4
      worksheet.getCell('A4').value = 'JABATAN';
      worksheet.getCell('A4').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('A4').border = borderProperties;
      worksheet.mergeCells('B4:H4');
      worksheet.getCell('B4').value = jabatan;
      worksheet.getCell('B4').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('B4').border = borderProperties;

      // baris ke-5
      worksheet.getCell('A5').value = 'UNIT KERJA';
      worksheet.getCell('A5').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('A5').border = borderProperties;
      worksheet.mergeCells('B5:H5');
      worksheet.getCell('B5').value = unitKerja || 'Dinas Komunikasi, Informatika, Statistik Dan Persandian Kab. Buol';
      worksheet.getCell('B5').font = { size: 10, name: 'Cambria' };
      worksheet.getCell('B5').border = borderProperties;

      worksheet.addRow([
        'Hari / Tanggal',
        'No',
        'Jam',
        'Uraian Kegiatan Harian',
        'Hasil / Output',
        'Nilai Capaian Indikator Kinerja (%)',
        'Nilai Produktivitas Harian',
        'Paraf Pejabat Penilai'
      ]);

      worksheet.getColumn(1).width = 25; // Hari / Tanggal
      worksheet.getColumn(2).width = 5;  // No
      worksheet.getColumn(3).width = 10; // Jam
      worksheet.getColumn(4).width = 80; // Uraian Kegiatan
      worksheet.getColumn(5).width = 15; // Output
      worksheet.getColumn(6).width = 15; // Capaian
      worksheet.getColumn(7).width = 15; // Nilai
      worksheet.getColumn(8).width = 25; // Paraf

      const headerRow = worksheet.getRow(6);
      headerRow.height = 60;
      headerRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.font = { size: 11, name: 'Cambria' };
        cell.border = borderProperties;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'BDD7EE' } // Warna latar header
        };
      });

      worksheet.addRow([1, 2, 3, 4, 5, 6, 7, 8]);
      const numberRow = worksheet.getRow(7);
      numberRow.eachCell((cell) => {
        cell.font = { name: 'Cambria', size: 8, italic: true, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderProperties;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      });

      const laporanGrouped = {}; // { '2025-06-02': counter }

      let currentDate = null;
      let startRowIndex = null;

      laporan.forEach((lapor, index) => {
        const dateKey = moment(lapor.createdAt).format('YYYY-MM-DD');
        const tanggalFormatted = moment(lapor.createdAt).format('dddd, DD MMMM YYYY');
        const jamFormatted = moment(lapor.createdAt).format('HH:mm');

        const isFirstOfDate = !laporanGrouped[dateKey];
        if (isFirstOfDate) {
          laporanGrouped[dateKey] = 1;
          startRowIndex = worksheet.lastRow.number + 1; // catat baris awal untuk merge nanti
          currentDate = dateKey;
        } else {
          laporanGrouped[dateKey]++;
        }

        const dataRow = worksheet.addRow([
          tanggalFormatted.charAt(0).toUpperCase() + tanggalFormatted.slice(1),
          laporanGrouped[dateKey],
          jamFormatted,
          lapor.deskripsi,
          '',
          '',
          '',
          ''
        ]);

        dataRow.eachCell((cell, colNumber) => {
          cell.font = { size: 10, name: 'Cambria' };
          cell.border = borderProperties;
          cell.alignment = [1, 2, 3].includes(colNumber)
            ? { vertical: 'middle', horizontal: 'center', wrapText: true }
            : { vertical: 'top', wrapText: true };
        });

        const isLastOfGroup =
          index === laporan.length - 1 || moment(laporan[index + 1].createdAt).format('YYYY-MM-DD') !== dateKey;

        if (isLastOfGroup) {
          // Tambah baris nilai capaian rata-rata
          const summaryRow = worksheet.addRow(['', '', '', '', '', '', '', '']);
          const summaryRowIndex = summaryRow.number;

          // Merge B:E → nilai capaian rata-rata
          worksheet.mergeCells(`B${summaryRowIndex}:E${summaryRowIndex}`);
          worksheet.getCell(`B${summaryRowIndex}`).value = 'Nilai Capaian Indikator Kinerja Rata-Rata per hari';
          worksheet.getCell(`B${summaryRowIndex}`).font = { name: 'Cambria', italic: true, size: 10 };
          worksheet.getCell(`B${summaryRowIndex}`).alignment = { horizontal: 'center', vertical: 'middle' };

          // Kolom F untuk nilai
          worksheet.getCell(`F${summaryRowIndex}`).value = '';
          worksheet.getCell(`F${summaryRowIndex}`).alignment = { horizontal: 'center', vertical: 'middle' };

          // Warna biru muda di B:F
          ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
            const cell = worksheet.getCell(`${col}${summaryRowIndex}`);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFBDD7EE' } // biru muda
            };
            cell.border = borderProperties;
          });

          // Merge kolom A, G, dan H dari startRowIndex hingga summaryRowIndex
          worksheet.mergeCells(`A${startRowIndex}:A${summaryRowIndex}`);
          worksheet.mergeCells(`G${startRowIndex}:G${summaryRowIndex}`);
          worksheet.mergeCells(`H${startRowIndex}:H${summaryRowIndex}`);

          // Alignment dan border untuk merged cells
          ['A', 'G', 'H'].forEach((col) => {
            const cell = worksheet.getCell(`${col}${startRowIndex}`);
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = borderProperties;
          });
        }
      });

      // 
      // 
      // 
      // 
      // === Sheet Dokumentasi ===
      const worksheetFoto = workbook.addWorksheet('Dokumentasi');

      // Header
      worksheetFoto.addRow(['Tanggal', 'Deskripsi', 'Jam', 'Foto Dokumentasi']);
      const headerRowFoto = worksheetFoto.getRow(1);
      headerRowFoto.font = { bold: true };
      headerRowFoto.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRowFoto.eachCell((cell) => {
        cell.border = borderProperties;
      });

      // Lebar kolom & alignment
      worksheetFoto.getColumn(1).width = 20; // Tanggal
      worksheetFoto.getColumn(2).width = 60; // Deskripsi
      worksheetFoto.getColumn(3).width = 10; // Jam
      worksheetFoto.getColumn(4).width = 60; // Foto

      // Baris-baris laporan yang punya foto
      let fotoRowIdx = 2;
      for (const lapor of laporan) {
        if (lapor.foto) {
          const url = `${process.env.STORAGE_URL}/${lapor.foto}`;
          const tanggal = moment(lapor.createdAt).format('dddd, DD MMMM YYYY');
          const jam = moment(lapor.createdAt).format('HH:mm');
          const deskripsi = lapor.deskripsi;

          worksheetFoto.getCell(`A${fotoRowIdx}`).value = tanggal.charAt(0).toUpperCase() + tanggal.slice(1);
          worksheetFoto.getCell(`B${fotoRowIdx}`).value = deskripsi;
          worksheetFoto.getCell(`C${fotoRowIdx}`).value = jam;
          const linkCell = worksheetFoto.getCell(`D${fotoRowIdx}`);
          linkCell.value = { text: lapor.foto, hyperlink: url };
          linkCell.font = {
            name: 'Cambria',
            size: 10,
            italic: true,
            underline: true,
            color: { argb: 'FF0000FF' } // biru
          };

          // Style per kolom
          ['A', 'B', 'C', 'D'].forEach((col, i) => {
            const cell = worksheetFoto.getCell(`${col}${fotoRowIdx}`);
            cell.font = { name: 'Cambria', size: 10 };
            cell.border = borderProperties;

            if (col === 'A' || col === 'C' || col === 'D') {
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            } else {
              cell.alignment = { vertical: 'top', wrapText: true };
            }
          });

          fotoRowIdx++;
        }
      }

      // 
      // 
      // 
      // 
      // Simpan file Excel
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
