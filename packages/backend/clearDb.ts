import { endTourData } from './src/services/tourService';

endTourData().then(() => {
  console.log('Database wiped');
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
