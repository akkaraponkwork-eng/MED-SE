import { useState, useCallback } from 'react'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { usePatients } from '../hooks/useRecords'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const PLATOONS = ['หมวด 1', 'หมวด 2', 'หมวด 3', 'หมวด 4', 'หมวด 5', 'อื่นๆ']

// ข้อมูลรายชื่อทหารใหม่ 1/69 จาก Google Sheet (156 คน)
const STATIC_PATIENTS = [
  // หมวด 1
  { id: 'p1', rank: 'พลฯ', firstName: 'พิทยา', lastName: 'พงษ์คุณ', platoon: 'หมวด 1', number: '1' },
  { id: 'p2', rank: 'พลฯ', firstName: 'อนุชา', lastName: 'แสงประเสริฐ', platoon: 'หมวด 1', number: '2' },
  { id: 'p3', rank: 'พลฯ', firstName: 'อรรถพล', lastName: 'ศรีเดช', platoon: 'หมวด 1', number: '3' },
  { id: 'p4', rank: 'พลฯ', firstName: 'นิธิศ', lastName: 'ไชยทาน', platoon: 'หมวด 1', number: '4' },
  { id: 'p5', rank: 'พลฯ', firstName: 'สรวุฒิ', lastName: 'พงศ์ไพรประเสริฐ', platoon: 'หมวด 1', number: '5' },
  { id: 'p6', rank: 'พลฯ', firstName: 'ณัฐพงษ์', lastName: 'มณีวรรณ', platoon: 'หมวด 1', number: '6' },
  { id: 'p7', rank: 'พลฯ', firstName: 'อัครพล', lastName: 'ไกรกลิ่น', platoon: 'หมวด 1', number: '7' },
  { id: 'p8', rank: 'พลฯ', firstName: 'พรเทพ', lastName: 'แก้วทุ่ง', platoon: 'หมวด 1', number: '8' },
  { id: 'p9', rank: 'พลฯ', firstName: 'วสุธา', lastName: 'ท้าวลา', platoon: 'หมวด 1', number: '9' },
  { id: 'p10', rank: 'พลฯ', firstName: 'กฤษดา', lastName: 'จันทร์ละมูล', platoon: 'หมวด 1', number: '10' },
  { id: 'p11', rank: 'พลฯ', firstName: 'ธนวิชญ์', lastName: 'สินลี้', platoon: 'หมวด 1', number: '11' },
  { id: 'p12', rank: 'พลฯ', firstName: 'ไตรภพ', lastName: 'ทองใหล', platoon: 'หมวด 1', number: '12' },
  { id: 'p13', rank: 'พลฯ', firstName: 'ปฏิพัทธ์', lastName: 'คงเมือง', platoon: 'หมวด 1', number: '13' },
  { id: 'p14', rank: 'พลฯ', firstName: 'สุพรรณ', lastName: 'รินคำ', platoon: 'หมวด 1', number: '14' },
  { id: 'p15', rank: 'พลฯ', firstName: 'ชิติพัทธ์', lastName: 'สามลปาม', platoon: 'หมวด 1', number: '15' },
  { id: 'p16', rank: 'พลฯ', firstName: 'กิตติพล', lastName: 'โพธ์พันธ์', platoon: 'หมวด 1', number: '16' },
  { id: 'p17', rank: 'พลฯ', firstName: 'ณัฐกิตติ์', lastName: 'รอดเกิด', platoon: 'หมวด 1', number: '17' },
  { id: 'p18', rank: 'พลฯ', firstName: 'กิตติวัฒน์', lastName: 'คำมาเกี๋ยง', platoon: 'หมวด 1', number: '18' },
  { id: 'p19', rank: 'พลฯ', firstName: 'พิชชปกรณ์', lastName: 'โปธา', platoon: 'หมวด 1', number: '19' },
  { id: 'p20', rank: 'พลฯ', firstName: 'นราวิชญ์', lastName: 'เสาร์จักร์', platoon: 'หมวด 1', number: '20' },
  { id: 'p21', rank: 'พลฯ', firstName: 'ธนวัฒน์', lastName: 'ยาณะวงค์ษา', platoon: 'หมวด 1', number: '21' },
  { id: 'p22', rank: 'พลฯ', firstName: 'มนต์ธัช', lastName: 'มูลนิลตา', platoon: 'หมวด 1', number: '22' },
  { id: 'p23', rank: 'พลฯ', firstName: 'ธนพัฒน์', lastName: 'ยุติธรรม', platoon: 'หมวด 1', number: '23' },
  { id: 'p24', rank: 'พลฯ', firstName: 'สุรชัย', lastName: 'พลขัน', platoon: 'หมวด 1', number: '24' },
  { id: 'p25', rank: 'พลฯ', firstName: 'อภิวรรธน์', lastName: 'เศษฐา', platoon: 'หมวด 1', number: '25' },
  { id: 'p26', rank: 'พลฯ', firstName: 'ธวัชชัย', lastName: 'กล่ำนาค', platoon: 'หมวด 1', number: '26' },
  { id: 'p27', rank: 'พลฯ', firstName: 'วชิรวิทย์', lastName: 'มณีศรี', platoon: 'หมวด 1', number: '27' },
  { id: 'p28', rank: 'พลฯ', firstName: 'เอกวิทย์', lastName: 'ต้นหนองดู่', platoon: 'หมวด 1', number: '28' },
  { id: 'p29', rank: 'พลฯ', firstName: 'ปวริศร์', lastName: 'สาทแก้ว', platoon: 'หมวด 1', number: '29' },
  { id: 'p30', rank: 'พลฯ', firstName: 'ภัทรพงศ์', lastName: 'ยะมงคล', platoon: 'หมวด 1', number: '30' },
  { id: 'p31', rank: 'พลฯ', firstName: 'พีระนันท์', lastName: 'ยุระศรี', platoon: 'หมวด 1', number: '31' },
  { id: 'p32', rank: 'พลฯ', firstName: 'นนทกานต์', lastName: 'วณีสอน', platoon: 'หมวด 1', number: '32' },
  { id: 'p33', rank: 'พลฯ', firstName: 'ภูสรรค์', lastName: 'ชีวทรัพย์คีรี', platoon: 'หมวด 1', number: '33' },
  { id: 'p34', rank: 'พลฯ', firstName: 'ศักดา', lastName: 'ประสาทแก้ว', platoon: 'หมวด 1', number: '34' },
  { id: 'p35', rank: 'พลฯ', firstName: 'คณาธิป', lastName: 'จางใส', platoon: 'หมวด 1', number: '35' },
  { id: 'p36', rank: 'พลฯ', firstName: 'สิรวิชญ์', lastName: 'พรมฮวด', platoon: 'หมวด 1', number: '36' },
  { id: 'p37', rank: 'พลฯ', firstName: 'คมกฤต', lastName: 'ปุ้ยทอง', platoon: 'หมวด 1', number: '37' },
  { id: 'p38', rank: 'พลฯ', firstName: 'พีรพัฒน์', lastName: 'พานทอง', platoon: 'หมวด 1', number: '38' },
  { id: 'p39', rank: 'พลฯ', firstName: 'พัทธพล', lastName: 'บวรกิจทวีสกุล', platoon: 'หมวด 1', number: '39' },
  // หมวด 2
  { id: 'p40', rank: 'พลฯ', firstName: 'ภานุกร', lastName: 'โพธิ์เพ็ง', platoon: 'หมวด 2', number: '40' },
  { id: 'p41', rank: 'พลฯ', firstName: 'สรวิชณ์', lastName: 'หุนกระโทก', platoon: 'หมวด 2', number: '41' },
  { id: 'p42', rank: 'พลฯ', firstName: 'ปุณณภพ', lastName: 'ปุ่มนอก', platoon: 'หมวด 2', number: '42' },
  { id: 'p43', rank: 'พลฯ', firstName: 'ณัฐภูมิ', lastName: 'จันสี', platoon: 'หมวด 2', number: '43' },
  { id: 'p44', rank: 'พลฯ', firstName: 'กิตติพงษ์', lastName: 'แย้มชุมพร', platoon: 'หมวด 2', number: '44' },
  { id: 'p45', rank: 'พลฯ', firstName: 'ปิติกร', lastName: 'หงทัพ', platoon: 'หมวด 2', number: '45' },
  { id: 'p46', rank: 'พลฯ', firstName: 'มานะชัย', lastName: 'เขียวเกษม', platoon: 'หมวด 2', number: '46' },
  { id: 'p47', rank: 'พลฯ', firstName: 'ชนะชัย', lastName: 'เขียวเกษม', platoon: 'หมวด 2', number: '47' },
  { id: 'p48', rank: 'พลฯ', firstName: 'ศราวุฒิ', lastName: 'มุ่งปั่นกลาง', platoon: 'หมวด 2', number: '48' },
  { id: 'p49', rank: 'พลฯ', firstName: 'ประดิษฐาปกรณ์', lastName: 'พัทยา', platoon: 'หมวด 2', number: '49' },
  { id: 'p50', rank: 'พลฯ', firstName: 'ธนพนธ์', lastName: 'ศรีเชียงซุย', platoon: 'หมวด 2', number: '50' },
  { id: 'p51', rank: 'พลฯ', firstName: 'พีรยุทธ', lastName: 'เพชรทอง', platoon: 'หมวด 2', number: '51' },
  { id: 'p52', rank: 'พลฯ', firstName: 'ธีระฉัตร์', lastName: 'เศรษฐีพ่อค้า', platoon: 'หมวด 2', number: '52' },
  { id: 'p53', rank: 'พลฯ', firstName: 'เสกศิริ', lastName: 'จันทาสร', platoon: 'หมวด 2', number: '53' },
  { id: 'p54', rank: 'พลฯ', firstName: 'พรบดินทร์', lastName: 'พลแสน', platoon: 'หมวด 2', number: '54' },
  { id: 'p55', rank: 'พลฯ', firstName: 'ปิยวัฒน์', lastName: 'อยู่ช้าง', platoon: 'หมวด 2', number: '55' },
  { id: 'p56', rank: 'พลฯ', firstName: 'อดิเทพ', lastName: 'อินทร์แป้น', platoon: 'หมวด 2', number: '56' },
  { id: 'p57', rank: 'พลฯ', firstName: 'ชนกันต์', lastName: 'พับทอง', platoon: 'หมวด 2', number: '57' },
  { id: 'p58', rank: 'พลฯ', firstName: 'บุญนาค', lastName: 'เหล็กสัก', platoon: 'หมวด 2', number: '58' },
  { id: 'p59', rank: 'พลฯ', firstName: 'นิธิสิทธิ์', lastName: 'จันทร์ขำ', platoon: 'หมวด 2', number: '59' },
  { id: 'p60', rank: 'พลฯ', firstName: 'อิทธิพล', lastName: 'ภูมิอภิธรรม', platoon: 'หมวด 2', number: '60' },
  { id: 'p61', rank: 'พลฯ', firstName: 'ธรรมรัตน์', lastName: 'รัญเสวะ', platoon: 'หมวด 2', number: '61' },
  { id: 'p62', rank: 'พลฯ', firstName: 'ธนกร', lastName: 'มั่นประสงค์', platoon: 'หมวด 2', number: '62' },
  { id: 'p63', rank: 'พลฯ', firstName: 'ธีรเดช', lastName: 'พรรคเจริญ', platoon: 'หมวด 2', number: '63' },
  { id: 'p64', rank: 'พลฯ', firstName: 'พีรพัฒน์', lastName: 'สลุงอยู่', platoon: 'หมวด 2', number: '64' },
  { id: 'p65', rank: 'พลฯ', firstName: 'ศุภณัฐ', lastName: 'สังข์ทอง', platoon: 'หมวด 2', number: '65' },
  { id: 'p66', rank: 'พลฯ', firstName: 'กชกร', lastName: 'แซ่เฮา', platoon: 'หมวด 2', number: '66' },
  { id: 'p67', rank: 'พลฯ', firstName: 'พงศกร', lastName: 'จันทร', platoon: 'หมวด 2', number: '67' },
  { id: 'p68', rank: 'พลฯ', firstName: 'พุฒิพันธ์', lastName: 'พุ่มเทศ', platoon: 'หมวด 2', number: '68' },
  { id: 'p69', rank: 'พลฯ', firstName: 'อดิศักดิ์', lastName: 'ยอกร', platoon: 'หมวด 2', number: '69' },
  { id: 'p70', rank: 'พลฯ', firstName: 'ชีวธันย์', lastName: 'กิ่งเนตร', platoon: 'หมวด 2', number: '70' },
  { id: 'p71', rank: 'พลฯ', firstName: 'อธิชา', lastName: 'คงเงิน', platoon: 'หมวด 2', number: '71' },
  { id: 'p72', rank: 'พลฯ', firstName: 'เทวัญ', lastName: 'ดีประสิทธิ์', platoon: 'หมวด 2', number: '72' },
  { id: 'p73', rank: 'พลฯ', firstName: 'มานิตย์', lastName: 'แกละวัน', platoon: 'หมวด 2', number: '73' },
  { id: 'p74', rank: 'พลฯ', firstName: 'ฉันทัช', lastName: 'ศรีมะเรือง', platoon: 'หมวด 2', number: '74' },
  { id: 'p75', rank: 'พลฯ', firstName: 'รชต', lastName: 'จันทร์ลาย', platoon: 'หมวด 2', number: '75' },
  { id: 'p76', rank: 'พลฯ', firstName: 'ศุภณัฐ', lastName: 'พุกำพันธ์', platoon: 'หมวด 2', number: '76' },
  { id: 'p77', rank: 'พลฯ', firstName: 'ณัฐนันท์', lastName: 'ยิ้มช้าง', platoon: 'หมวด 2', number: '77' },
  { id: 'p78', rank: 'พลฯ', firstName: 'ทนงศักดิ์', lastName: 'สีชอล์ด', platoon: 'หมวด 2', number: '78' },
  // หมวด 3
  { id: 'p79', rank: 'พลฯ', firstName: 'จรูญโรจน์', lastName: 'ภูรัตนพลที', platoon: 'หมวด 3', number: '79' },
  { id: 'p80', rank: 'พลฯ', firstName: 'ธนากร', lastName: 'ณ บางช้าง', platoon: 'หมวด 3', number: '80' },
  { id: 'p81', rank: 'พลฯ', firstName: 'คณิศร', lastName: 'คำจัด', platoon: 'หมวด 3', number: '81' },
  { id: 'p82', rank: 'พลฯ', firstName: 'ภูมิรพี', lastName: 'จินนะ', platoon: 'หมวด 3', number: '82' },
  { id: 'p83', rank: 'พลฯ', firstName: 'พงศกร', lastName: 'ชุ่มวะมล', platoon: 'หมวด 3', number: '83' },
  { id: 'p84', rank: 'พลฯ', firstName: 'วีรภาพ', lastName: 'แขกใจเย็น', platoon: 'หมวด 3', number: '84' },
  { id: 'p85', rank: 'พลฯ', firstName: 'ธัณชนก', lastName: 'หาญกล้า', platoon: 'หมวด 3', number: '85' },
  { id: 'p86', rank: 'พลฯ', firstName: 'กรัณย์พล', lastName: 'ไทยสงวน', platoon: 'หมวด 3', number: '86' },
  { id: 'p87', rank: 'พลฯ', firstName: 'กิตติพงษ์', lastName: 'ลึกวิลัย', platoon: 'หมวด 3', number: '87' },
  { id: 'p88', rank: 'พลฯ', firstName: 'รัฐภูมิ', lastName: 'ปินะทานัง', platoon: 'หมวด 3', number: '88' },
  { id: 'p89', rank: 'พลฯ', firstName: 'ศิศีระ', lastName: 'เกิดวิเศษ', platoon: 'หมวด 3', number: '89' },
  { id: 'p90', rank: 'พลฯ', firstName: 'เกรียงไกร', lastName: 'กันทะวงศ์', platoon: 'หมวด 3', number: '90' },
  { id: 'p91', rank: 'พลฯ', firstName: 'ชัชวาล', lastName: 'แร่เพ็ชร์', platoon: 'หมวด 3', number: '91' },
  { id: 'p92', rank: 'พลฯ', firstName: 'ศรายุทธ', lastName: 'ศรีรักษา', platoon: 'หมวด 3', number: '92' },
  { id: 'p93', rank: 'พลฯ', firstName: 'ชินพัฒน์', lastName: 'แก้วผ่อง', platoon: 'หมวด 3', number: '93' },
  { id: 'p94', rank: 'พลฯ', firstName: 'สถิตคุณ', lastName: 'พงษ์เขียว', platoon: 'หมวด 3', number: '94' },
  { id: 'p95', rank: 'พลฯ', firstName: 'สิทธิพล', lastName: 'อยู่เย็น', platoon: 'หมวด 3', number: '95' },
  { id: 'p96', rank: 'พลฯ', firstName: 'สุทธิพงศ์', lastName: 'วงษ์ขาว', platoon: 'หมวด 3', number: '96' },
  { id: 'p97', rank: 'พลฯ', firstName: 'วศิน', lastName: 'วังสีราช', platoon: 'หมวด 3', number: '97' },
  { id: 'p98', rank: 'พลฯ', firstName: 'ศรายุทธ', lastName: 'บัวแย้ม', platoon: 'หมวด 3', number: '98' },
  { id: 'p99', rank: 'พลฯ', firstName: 'สาธิต', lastName: 'อินทศรี', platoon: 'หมวด 3', number: '99' },
  { id: 'p100', rank: 'พลฯ', firstName: 'จักรินทร์', lastName: 'พอกเพิ่มดี', platoon: 'หมวด 3', number: '100' },
  { id: 'p101', rank: 'พลฯ', firstName: 'ณภัทร', lastName: 'สิงคำสอน', platoon: 'หมวด 3', number: '101' },
  { id: 'p102', rank: 'พลฯ', firstName: 'นัทธพงศ์', lastName: 'ประดิษฐตระกูล', platoon: 'หมวด 3', number: '102' },
  { id: 'p103', rank: 'พลฯ', firstName: 'ภาสกร', lastName: 'สุวรรณทอง', platoon: 'หมวด 3', number: '103' },
  { id: 'p104', rank: 'พลฯ', firstName: 'อัครพล', lastName: 'ดอนโหน่งฃา', platoon: 'หมวด 3', number: '104' },
  { id: 'p105', rank: 'พลฯ', firstName: 'ภัทรกร', lastName: 'กันยา', platoon: 'หมวด 3', number: '105' },
  { id: 'p106', rank: 'พลฯ', firstName: 'จรูญ', lastName: 'สุขแก้ว', platoon: 'หมวด 3', number: '106' },
  { id: 'p107', rank: 'พลฯ', firstName: 'ณภัทร', lastName: 'เกิดที่สุด', platoon: 'หมวด 3', number: '107' },
  { id: 'p108', rank: 'พลฯ', firstName: 'วรเดช', lastName: 'บุญคง', platoon: 'หมวด 3', number: '108' },
  { id: 'p109', rank: 'พลฯ', firstName: 'พงษ์พิพัฒน์', lastName: 'สิมบุตร', platoon: 'หมวด 3', number: '109' },
  { id: 'p110', rank: 'พลฯ', firstName: 'ศรายุทธ์', lastName: 'อ่ำทุ่งพงษ์', platoon: 'หมวด 3', number: '110' },
  { id: 'p111', rank: 'พลฯ', firstName: 'ปัฐวี', lastName: 'เลื่อนเพชร', platoon: 'หมวด 3', number: '111' },
  { id: 'p112', rank: 'พลฯ', firstName: 'ฐิติกร', lastName: 'ศรีโยธิน', platoon: 'หมวด 3', number: '112' },
  { id: 'p113', rank: 'พลฯ', firstName: 'สุธิศักดิ์', lastName: 'อุ่นบุญมา', platoon: 'หมวด 3', number: '113' },
  { id: 'p114', rank: 'พลฯ', firstName: 'ปริญญา', lastName: 'จำปาหอม', platoon: 'หมวด 3', number: '114' },
  { id: 'p115', rank: 'พลฯ', firstName: 'ณัฐดนัย', lastName: 'อ่อนสำอางค์', platoon: 'หมวด 3', number: '115' },
  { id: 'p116', rank: 'พลฯ', firstName: 'นัทธภูมิ', lastName: 'จันที', platoon: 'หมวด 3', number: '116' },
  { id: 'p117', rank: 'พลฯ', firstName: 'อาคาพงษ์', lastName: 'เอกอาชาชัย', platoon: 'หมวด 3', number: '117' },
  // หมวด 4
  { id: 'p118', rank: 'พลฯ', firstName: 'ธีรภัทร', lastName: 'แซ่ลี้', platoon: 'หมวด 4', number: '118' },
  { id: 'p119', rank: 'พลฯ', firstName: 'คงพันธ์', lastName: 'สุขชู', platoon: 'หมวด 4', number: '119' },
  { id: 'p120', rank: 'พลฯ', firstName: 'เดโชชัย', lastName: 'ใจเย็น', platoon: 'หมวด 4', number: '120' },
  { id: 'p121', rank: 'พลฯ', firstName: 'รัชชานนท์', lastName: 'บุญปั๋น', platoon: 'หมวด 4', number: '121' },
  { id: 'p122', rank: 'พลฯ', firstName: 'วีรพล', lastName: 'ปู่ลัวะ', platoon: 'หมวด 4', number: '122' },
  { id: 'p123', rank: 'พลฯ', firstName: 'กฤษณะ', lastName: 'ยานะโส', platoon: 'หมวด 4', number: '123' },
  { id: 'p124', rank: 'พลฯ', firstName: 'ไกรวุธ', lastName: 'หาวา', platoon: 'หมวด 4', number: '124' },
  { id: 'p125', rank: 'พลฯ', firstName: 'พงศ์ภรณ์', lastName: 'ชานุวัจน์', platoon: 'หมวด 4', number: '125' },
  { id: 'p126', rank: 'พลฯ', firstName: 'พีรวิชญ์', lastName: 'หอมลา', platoon: 'หมวด 4', number: '126' },
  { id: 'p127', rank: 'พลฯ', firstName: 'ธนพล', lastName: 'บุญปัญญาโรจน์', platoon: 'หมวด 4', number: '127' },
  { id: 'p128', rank: 'พลฯ', firstName: 'ณัฐวุฒิ', lastName: 'โกชุม', platoon: 'หมวด 4', number: '128' },
  { id: 'p129', rank: 'พลฯ', firstName: 'กรกช', lastName: 'ภีระคำ', platoon: 'หมวด 4', number: '129' },
  { id: 'p130', rank: 'พลฯ', firstName: 'สิทธิพงค์', lastName: 'คำหมั้น', platoon: 'หมวด 4', number: '130' },
  { id: 'p131', rank: 'พลฯ', firstName: 'วีระพงษ์', lastName: 'ใจมาคำ', platoon: 'หมวด 4', number: '131' },
  { id: 'p132', rank: 'พลฯ', firstName: 'ปาราเมธ', lastName: 'สุขสุมิตร', platoon: 'หมวด 4', number: '132' },
  { id: 'p133', rank: 'พลฯ', firstName: 'ศุภกร', lastName: 'น้อยเอี่ยม', platoon: 'หมวด 4', number: '133' },
  { id: 'p134', rank: 'พลฯ', firstName: 'สุรนาท', lastName: 'โตส้ม', platoon: 'หมวด 4', number: '134' },
  { id: 'p135', rank: 'พลฯ', firstName: 'อรรถกร', lastName: 'โคกเทียน', platoon: 'หมวด 4', number: '135' },
  { id: 'p136', rank: 'พลฯ', firstName: 'พงศ์พิสุทธิ์', lastName: 'ใหม่ศรี', platoon: 'หมวด 4', number: '136' },
  { id: 'p137', rank: 'พลฯ', firstName: 'ภีมพล', lastName: 'จูเที่ยง', platoon: 'หมวด 4', number: '137' },
  { id: 'p138', rank: 'พลฯ', firstName: 'บรรจง', lastName: 'ตรีเนตร', platoon: 'หมวด 4', number: '138' },
  { id: 'p139', rank: 'พลฯ', firstName: 'พรเทพ', lastName: 'อารมณ์', platoon: 'หมวด 4', number: '139' },
  { id: 'p140', rank: 'พลฯ', firstName: 'สุทธิพงษ์', lastName: 'เมืองมูล', platoon: 'หมวด 4', number: '140' },
  { id: 'p141', rank: 'พลฯ', firstName: 'กรกฤต', lastName: 'เขื่อนชนะ', platoon: 'หมวด 4', number: '141' },
  { id: 'p142', rank: 'พลฯ', firstName: 'ตระกูล', lastName: 'ถิ่นสุข', platoon: 'หมวด 4', number: '142' },
  { id: 'p143', rank: 'พลฯ', firstName: 'อภิวัฒน์', lastName: 'บุญธรรม', platoon: 'หมวด 4', number: '143' },
  { id: 'p144', rank: 'พลฯ', firstName: 'ธนาวัฒน์', lastName: 'กาบแก้ว', platoon: 'หมวด 4', number: '144' },
  { id: 'p145', rank: 'พลฯ', firstName: 'ณัฐกุล', lastName: 'ฉิมสุนทร', platoon: 'หมวด 4', number: '145' },
  { id: 'p146', rank: 'พลฯ', firstName: 'ณัฐภัทร', lastName: 'เจริญรุ่ง', platoon: 'หมวด 4', number: '146' },
  { id: 'p147', rank: 'พลฯ', firstName: 'ธนกร', lastName: 'ศรีเลิศ', platoon: 'หมวด 4', number: '147' },
  { id: 'p148', rank: 'พลฯ', firstName: 'อัศนี', lastName: 'มีศรี', platoon: 'หมวด 4', number: '148' },
  { id: 'p149', rank: 'พลฯ', firstName: 'นรธีร์', lastName: 'สังข์ทอง', platoon: 'หมวด 4', number: '149' },
  { id: 'p150', rank: 'พลฯ', firstName: 'ทศพล', lastName: 'ประจง', platoon: 'หมวด 4', number: '150' },
  { id: 'p151', rank: 'พลฯ', firstName: 'นันทพงศ์', lastName: 'ทักท้วง', platoon: 'หมวด 4', number: '151' },
  { id: 'p152', rank: 'พลฯ', firstName: 'เรืองเดช', lastName: 'จันทขาว', platoon: 'หมวด 4', number: '152' },
  { id: 'p153', rank: 'พลฯ', firstName: 'ภูวดล', lastName: 'ครุธชาติ', platoon: 'หมวด 4', number: '153' },
  { id: 'p154', rank: 'พลฯ', firstName: 'พัทธพล', lastName: 'คเชนทร', platoon: 'หมวด 4', number: '154' },
  { id: 'p155', rank: 'พลฯ', firstName: 'อธิชา', lastName: 'ทองพิมม์', platoon: 'หมวด 4', number: '155' },
  { id: 'p156', rank: 'พลฯ', firstName: 'อายุวัต', lastName: 'สมทิพย์', platoon: 'หมวด 4', number: '156' },
]

function formatThaiDate(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(dateStr)
  if (isNaN(dt)) return ''
  const y = dt.getFullYear() + 543
  return `${d} ${THAI_MONTHS[m - 1]} ${y.toString().slice(-2)}`
}

export default function PatientForm({ date, onSave, onClose, editData }) {
  const { patients: apiPatients } = usePatients()
  const allPatients = apiPatients.length > 0 ? apiPatients : STATIC_PATIENTS

  const [step, setStep] = useState(editData ? 'form' : 'select')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(editData?.patient || null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // form fields
  const [form, setForm] = useState({
    destination: editData?.destination || 'ตร.ศบบ.',
    symptoms: editData?.symptoms || '',
    examResult: editData?.examResult || '',
    treatment: editData?.treatment || '',
    appointmentDate: editData?.appointmentDate || date || '',
    appointmentTime: editData?.appointmentTime || '',
    notes: editData?.notes || '',
    noAppointment: editData?.noAppointment || false,
  })

  const filtered = search.trim()
    ? allPatients.filter(p => {
      const full = `${p.rank} ${p.firstName} ${p.lastName} ${p.platoon} ${p.number}`
      return full.toLowerCase().includes(search.toLowerCase()) ||
        p.firstName.includes(search) || p.lastName.includes(search) ||
        p.number?.includes(search)
    })
    : allPatients

  const handleSelect = (p) => {
    setSelected(p)
    setStep('form')
    setSearch('')
  }

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSave = () => {
    if (!selected) return
    const record = {
      id: editData?.id,
      date,
      patient: selected,
      ...form,
    }
    onSave(record)
  }

  const fullName = selected ? `${selected.rank} ${selected.firstName} ${selected.lastName}` : ''
  const metaInfo = selected ? `${selected.platoon} เลขที่ ${selected.number}` : ''

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <span style={{ fontSize: '1.2rem' }}>🏥</span>
          <h2 className="modal-title">{editData ? 'แก้ไขผู้ป่วย' : 'เพิ่มผู้ป่วย'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} id="close-modal-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: Select Patient */}
          {step === 'select' && (
            <div className="fade-in">
              <div className="section-divider"><span>เลือกรายชื่อผู้ป่วย</span></div>

              <div className="form-group">
                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <Search size={16} className="input-icon" />
                  <input
                    id="patient-search"
                    type="text"
                    className="form-control"
                    placeholder="ค้นหาชื่อ, นามสกุล, หมวด, เลขที่..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                  />
                  {search && (
                    <button
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
                      onClick={() => setSearch('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="search-results">
                  {filtered.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                      ไม่พบรายชื่อ
                    </div>
                  ) : filtered.map(p => (
                    <div
                      key={p.id}
                      className="search-result-item"
                      onClick={() => handleSelect(p)}
                      id={`patient-${p.id}`}
                    >
                      <strong>{p.rank} {p.firstName} {p.lastName}</strong>
                      <span>{p.platoon} เลขที่ {p.number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Entry Option */}
              <div className="section-divider"><span>หรือกรอกเอง</span></div>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setSelected({ id: 'manual', rank: 'พลฯ', firstName: '', lastName: '', platoon: 'หมวด 1', number: '' })
                  setStep('manual')
                }}
              >
                กรอกรายชื่อด้วยตนเอง
              </button>
            </div>
          )}

          {/* Step 1.5: Manual entry */}
          {step === 'manual' && (
            <div className="fade-in">
              <div className="section-divider"><span>กรอกรายชื่อด้วยตนเอง</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ยศ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.rank || ''}
                    onChange={e => setSelected(s => ({ ...s, rank: e.target.value }))}
                    placeholder="พลฯ"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ชื่อ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.firstName || ''}
                    onChange={e => setSelected(s => ({ ...s, firstName: e.target.value }))}
                    placeholder="ชื่อจริง"
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">นามสกุล</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.lastName || ''}
                    onChange={e => setSelected(s => ({ ...s, lastName: e.target.value }))}
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">หมวด</label>
                  <select
                    className="form-control"
                    value={selected?.platoon || ''}
                    onChange={e => setSelected(s => ({ ...s, platoon: e.target.value }))}
                  >
                    {PLATOONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">เลขที่</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selected?.number || ''}
                    onChange={e => setSelected(s => ({ ...s, number: e.target.value }))}
                    placeholder="เลขที่"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep('select')}>← กลับ</button>
                <button
                  className="btn btn-primary flex-1"
                  disabled={!selected?.firstName}
                  onClick={() => setStep('form')}
                  style={{ flex: 1 }}
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Fill Form */}
          {step === 'form' && (
            <div className="fade-in">
              {/* Selected Patient Display */}
              <div className="selected-patient">
                <span style={{ fontSize: '1.5rem' }}>👤</span>
                <div className="selected-patient-info">
                  <strong>{fullName}</strong>
                  <span>{metaInfo}</span>
                </div>
                <button className="btn-change" onClick={() => setStep('select')}>เปลี่ยน</button>
              </div>

              {/* Destination Selector */}
              <div className="form-group">
                <label className="form-label">ส่งป่วยที่</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['ตร.ศบบ.', 'รพ. อปร.ฯ'].map(dest => (
                    <button
                      key={dest}
                      type="button"
                      id={`dest-${dest}`}
                      onClick={() => handleChange('destination', dest)}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: form.destination === dest
                          ? '2px solid var(--green-500)'
                          : '1.5px solid var(--gray-200)',
                        background: form.destination === dest
                          ? 'linear-gradient(135deg, var(--green-500), var(--green-600))'
                          : 'white',
                        color: form.destination === dest ? 'white' : 'var(--gray-600)',
                        fontFamily: 'var(--font-th)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: form.destination === dest ? '0 4px 12px rgba(22,163,74,0.3)' : 'none',
                      }}
                    >
                      {dest === 'ตร.ศบบ.' ? 'ตร.ศบบ.' : 'รพ. อปร.ฯ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="form-group">
                <label className="form-label">อาการ</label>
                <textarea
                  id="symptoms-input"
                  className="form-control"
                  placeholder="กรอกอาการ..."
                  value={form.symptoms}
                  onChange={e => handleChange('symptoms', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Appointment */}
              <div className="section-divider"><span>วันนัดต่อ</span></div>

              <label className="checkbox-label" style={{ marginBottom: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={form.noAppointment}
                  onChange={e => handleChange('noAppointment', e.target.checked)}
                  id="no-appointment-check"
                />
                ไม่มีนัดต่อ
              </label>

              {!form.noAppointment && (
                <div className="appt-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">วันนัด</label>
                    <input
                      type="date"
                      className="form-control"
                      id="appt-date"
                      value={form.appointmentDate}
                      onChange={e => handleChange('appointmentDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">เวลานัด</label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <select
                        id="appt-hour"
                        className="form-control"
                        style={{ textAlign: 'center', flex: 1 }}
                        value={form.appointmentTime ? form.appointmentTime.split(':')[0] : ''}
                        onChange={e => {
                          const h = e.target.value
                          const m = form.appointmentTime ? (form.appointmentTime.split(':')[1] || '00') : '00'
                          handleChange('appointmentTime', h ? `${h}:${m}` : '')
                        }}
                      >
                        <option value="">hh</option>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span style={{ fontWeight: 700, color: 'var(--gray-500)', fontSize: '1.1rem' }}>:</span>
                      <select
                        id="appt-minute"
                        className="form-control"
                        style={{ textAlign: 'center', flex: 1 }}
                        value={form.appointmentTime ? (form.appointmentTime.split(':')[1] || '') : ''}
                        onChange={e => {
                          const m = e.target.value
                          const h = form.appointmentTime ? (form.appointmentTime.split(':')[0] || '08') : '08'
                          handleChange('appointmentTime', m ? `${h}:${m}` : '')
                        }}
                      >
                        <option value="">mm</option>
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: '0.75rem', padding: '0.4rem 0', color: 'var(--gray-500)' }}
                onClick={() => setShowAdvanced(v => !v)}
              >
                {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                &nbsp;{showAdvanced ? 'ซ่อน' : 'เพิ่มเติม'} (ผลการตรวจ, การรักษา, หมายเหตุ)
              </button>

              {showAdvanced && (
                <div className="fade-in" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">ผลการตรวจ</label>
                    <textarea
                      className="form-control"
                      placeholder="ผลการตรวจ..."
                      value={form.examResult}
                      onChange={e => handleChange('examResult', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">การรักษา / ยาที่ได้รับ</label>
                    <textarea
                      id="treatment-input"
                      className="form-control"
                      placeholder="รายการยา, การรักษา..."
                      value={form.treatment}
                      onChange={e => handleChange('treatment', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมายเหตุ / เพิ่มเติม</label>
                    <textarea
                      className="form-control"
                      placeholder="ข้อมูลเพิ่มเติม..."
                      value={form.notes}
                      onChange={e => handleChange('notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )} */}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
                  ยกเลิก
                </button>
                <button
                  id="save-patient-btn"
                  className="btn btn-primary"
                  onClick={handleSave}
                  style={{ flex: 2 }}
                >
                  บันทึก
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
