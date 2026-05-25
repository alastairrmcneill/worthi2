import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const HEADER =
  'account_name,account_type,date,value,deposited,mortgage_balance,purchase_price,original_deposit,is_shared,ownership_pct';

const EXAMPLE_ROWS = [
  'My Current Account,current,2024-01-01,5000,,,,,,',
  'Savings,current,2024-01-01,12000,,,,,,',
  'Visa Credit Card,credit_card,2024-01-01,1500,,,,,,',
  'Car Loan,loan,2024-01-01,8000,,,,,,',
  'Stocks ISA,investment,2024-01-01,25000,20000,,,,,',
  'SIPP Pension,pension,2024-01-01,45000,,,,,,',
  'My House,house,2024-01-01,320000,195000,250000,50000,false,',
  'Shared Flat,house,2024-01-01,450000,270000,380000,80000,true,60',
];

export async function downloadCsvTemplate(): Promise<void> {
  const csv = [HEADER, ...EXAMPLE_ROWS].join('\n');
  const uri = (cacheDirectory ?? '') + 'worthi_template.csv';
  await writeAsStringAsync(uri, csv, { encoding: 'utf8' });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Worthi CSV Template',
    UTI: 'public.comma-separated-values-text',
  });
}
