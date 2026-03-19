export interface VocabWord {
  english: string;
  vietnamese: string;
  phonetic: string;
  image?: string;
}

export interface Unit {
  id: string;
  name: string;
  topic: string;
  words: VocabWord[];
}

export interface GradeData {
  grade: number;
  label: string;
  units: Unit[];
}

const gradeColors: Record<number, { bg: string; text: string; emoji: string }> = {
  1: { bg: "bg-pink-100", text: "text-pink-600", emoji: "🌸" },
  2: { bg: "bg-rose-100", text: "text-rose-600", emoji: "🌷" },
  3: { bg: "bg-orange-100", text: "text-orange-600", emoji: "🍊" },
  4: { bg: "bg-amber-100", text: "text-amber-600", emoji: "⭐" },
  5: { bg: "bg-yellow-100", text: "text-yellow-600", emoji: "🌻" },
  6: { bg: "bg-sky-100", text: "text-sky-600", emoji: "🌊" },
  7: { bg: "bg-blue-100", text: "text-blue-600", emoji: "🦋" },
  8: { bg: "bg-indigo-100", text: "text-indigo-600", emoji: "🚀" },
  9: { bg: "bg-violet-100", text: "text-violet-600", emoji: "🎓" },
};

export const getGradeStyle = (grade: number) => gradeColors[grade] || gradeColors[1];

// Sample data — in production this would come from a database
export const gradesData: GradeData[] = [
  {
    grade: 3,
    label: "Lớp 3",
    units: [
      {
        id: "g3-u1",
        name: "Unit 1",
        topic: "Hello",
        words: [
          { english: "hello", vietnamese: "xin chào", phonetic: "/həˈloʊ/" },
          { english: "goodbye", vietnamese: "tạm biệt", phonetic: "/ɡʊdˈbaɪ/" },
          { english: "thank you", vietnamese: "cảm ơn", phonetic: "/θæŋk juː/" },
          { english: "please", vietnamese: "làm ơn", phonetic: "/pliːz/" },
          { english: "sorry", vietnamese: "xin lỗi", phonetic: "/ˈsɒri/" },
          { english: "yes", vietnamese: "vâng / có", phonetic: "/jɛs/" },
          { english: "no", vietnamese: "không", phonetic: "/noʊ/" },
          { english: "friend", vietnamese: "bạn bè", phonetic: "/frɛnd/" },
        ],
      },
      {
        id: "g3-u2",
        name: "Unit 2",
        topic: "My Body",
        words: [
          { english: "head", vietnamese: "đầu", phonetic: "/hɛd/" },
          { english: "hand", vietnamese: "tay", phonetic: "/hænd/" },
          { english: "eye", vietnamese: "mắt", phonetic: "/aɪ/" },
          { english: "ear", vietnamese: "tai", phonetic: "/ɪr/" },
          { english: "nose", vietnamese: "mũi", phonetic: "/noʊz/" },
          { english: "mouth", vietnamese: "miệng", phonetic: "/maʊθ/" },
        ],
      },
      {
        id: "g3-u3",
        name: "Unit 3",
        topic: "My Friends",
        words: [
          { english: "boy", vietnamese: "con trai", phonetic: "/bɔɪ/" },
          { english: "girl", vietnamese: "con gái", phonetic: "/ɡɜːrl/" },
          { english: "teacher", vietnamese: "giáo viên", phonetic: "/ˈtiːtʃər/" },
          { english: "student", vietnamese: "học sinh", phonetic: "/ˈstuːdənt/" },
          { english: "classroom", vietnamese: "lớp học", phonetic: "/ˈklæsruːm/" },
        ],
      },
    ],
  },
  {
    grade: 4,
    label: "Lớp 4",
    units: [
      {
        id: "g4-u1",
        name: "Unit 1",
        topic: "Nice to See You Again",
        words: [
          { english: "morning", vietnamese: "buổi sáng", phonetic: "/ˈmɔːrnɪŋ/" },
          { english: "afternoon", vietnamese: "buổi chiều", phonetic: "/ˌæftərˈnuːn/" },
          { english: "evening", vietnamese: "buổi tối", phonetic: "/ˈiːvnɪŋ/" },
          { english: "night", vietnamese: "đêm", phonetic: "/naɪt/" },
          { english: "meet", vietnamese: "gặp", phonetic: "/miːt/" },
          { english: "again", vietnamese: "lại", phonetic: "/əˈɡɛn/" },
        ],
      },
      {
        id: "g4-u2",
        name: "Unit 2",
        topic: "I'm from Japan",
        words: [
          { english: "country", vietnamese: "quốc gia", phonetic: "/ˈkʌntri/" },
          { english: "Japan", vietnamese: "Nhật Bản", phonetic: "/dʒəˈpæn/" },
          { english: "Vietnam", vietnamese: "Việt Nam", phonetic: "/ˌviːɛtˈnɑːm/" },
          { english: "America", vietnamese: "nước Mỹ", phonetic: "/əˈmɛrɪkə/" },
          { english: "England", vietnamese: "nước Anh", phonetic: "/ˈɪŋɡlənd/" },
        ],
      },
    ],
  },
  {
    grade: 5,
    label: "Lớp 5",
    units: [
      {
        id: "g5-u1",
        name: "Unit 1",
        topic: "What's Your Address?",
        words: [
          { english: "address", vietnamese: "địa chỉ", phonetic: "/ˈædrɛs/" },
          { english: "street", vietnamese: "đường phố", phonetic: "/striːt/" },
          { english: "city", vietnamese: "thành phố", phonetic: "/ˈsɪti/" },
          { english: "village", vietnamese: "làng", phonetic: "/ˈvɪlɪdʒ/" },
          { english: "district", vietnamese: "quận/huyện", phonetic: "/ˈdɪstrɪkt/" },
          { english: "province", vietnamese: "tỉnh", phonetic: "/ˈprɒvɪns/" },
        ],
      },
    ],
  },
  {
    grade: 6,
    label: "Lớp 6",
    units: [
      {
        id: "g6-u1",
        name: "Unit 1",
        topic: "My New School",
        words: [
          { english: "school", vietnamese: "trường học", phonetic: "/skuːl/" },
          { english: "subject", vietnamese: "môn học", phonetic: "/ˈsʌbdʒɪkt/" },
          { english: "timetable", vietnamese: "thời khóa biểu", phonetic: "/ˈtaɪmteɪbl/" },
          { english: "uniform", vietnamese: "đồng phục", phonetic: "/ˈjuːnɪfɔːrm/" },
          { english: "homework", vietnamese: "bài tập về nhà", phonetic: "/ˈhoʊmwɜːrk/" },
          { english: "library", vietnamese: "thư viện", phonetic: "/ˈlaɪbrəri/" },
          { english: "playground", vietnamese: "sân chơi", phonetic: "/ˈpleɪɡraʊnd/" },
        ],
      },
      {
        id: "g6-u2",
        name: "Unit 2",
        topic: "My Home",
        words: [
          { english: "kitchen", vietnamese: "nhà bếp", phonetic: "/ˈkɪtʃɪn/" },
          { english: "bedroom", vietnamese: "phòng ngủ", phonetic: "/ˈbɛdruːm/" },
          { english: "bathroom", vietnamese: "phòng tắm", phonetic: "/ˈbæθruːm/" },
          { english: "living room", vietnamese: "phòng khách", phonetic: "/ˈlɪvɪŋ ruːm/" },
          { english: "garden", vietnamese: "vườn", phonetic: "/ˈɡɑːrdn/" },
        ],
      },
    ],
  },
  {
    grade: 7,
    label: "Lớp 7",
    units: [
      {
        id: "g7-u1",
        name: "Unit 1",
        topic: "Hobbies",
        words: [
          { english: "hobby", vietnamese: "sở thích", phonetic: "/ˈhɒbi/" },
          { english: "collect", vietnamese: "sưu tầm", phonetic: "/kəˈlɛkt/" },
          { english: "gardening", vietnamese: "làm vườn", phonetic: "/ˈɡɑːrdnɪŋ/" },
          { english: "painting", vietnamese: "vẽ tranh", phonetic: "/ˈpeɪntɪŋ/" },
          { english: "cycling", vietnamese: "đạp xe", phonetic: "/ˈsaɪklɪŋ/" },
          { english: "photography", vietnamese: "nhiếp ảnh", phonetic: "/fəˈtɒɡrəfi/" },
        ],
      },
    ],
  },
  {
    grade: 8,
    label: "Lớp 8",
    units: [
      {
        id: "g8-u1",
        name: "Unit 1",
        topic: "Leisure Activities",
        words: [
          { english: "leisure", vietnamese: "giải trí", phonetic: "/ˈlɛʒər/" },
          { english: "socialise", vietnamese: "giao tiếp xã hội", phonetic: "/ˈsoʊʃəlaɪz/" },
          { english: "craft", vietnamese: "thủ công", phonetic: "/kræft/" },
          { english: "hang out", vietnamese: "đi chơi", phonetic: "/hæŋ aʊt/" },
          { english: "strum", vietnamese: "gảy đàn", phonetic: "/strʌm/" },
        ],
      },
    ],
  },
  {
    grade: 9,
    label: "Lớp 9",
    units: [
      {
        id: "g9-u1",
        name: "Unit 1",
        topic: "Local Environment",
        words: [
          { english: "environment", vietnamese: "môi trường", phonetic: "/ɪnˈvaɪrənmənt/" },
          { english: "pollution", vietnamese: "ô nhiễm", phonetic: "/pəˈluːʃn/" },
          { english: "recycle", vietnamese: "tái chế", phonetic: "/riːˈsaɪkl/" },
          { english: "preserve", vietnamese: "bảo tồn", phonetic: "/prɪˈzɜːrv/" },
          { english: "landscape", vietnamese: "phong cảnh", phonetic: "/ˈlændskeɪp/" },
          { english: "tradition", vietnamese: "truyền thống", phonetic: "/trəˈdɪʃn/" },
        ],
      },
    ],
  },
];

// Fill in grades 1 and 2 with basic data
gradesData.unshift(
  {
    grade: 1,
    label: "Lớp 1",
    units: [
      {
        id: "g1-u1",
        name: "Unit 1",
        topic: "Alphabet",
        words: [
          { english: "apple", vietnamese: "quả táo", phonetic: "/ˈæpl/" },
          { english: "ball", vietnamese: "quả bóng", phonetic: "/bɔːl/" },
          { english: "cat", vietnamese: "con mèo", phonetic: "/kæt/" },
          { english: "dog", vietnamese: "con chó", phonetic: "/dɒɡ/" },
          { english: "egg", vietnamese: "quả trứng", phonetic: "/ɛɡ/" },
          { english: "fish", vietnamese: "con cá", phonetic: "/fɪʃ/" },
        ],
      },
      {
        id: "g1-u2",
        name: "Unit 2",
        topic: "Colors",
        words: [
          { english: "red", vietnamese: "màu đỏ", phonetic: "/rɛd/" },
          { english: "blue", vietnamese: "màu xanh dương", phonetic: "/bluː/" },
          { english: "green", vietnamese: "màu xanh lá", phonetic: "/ɡriːn/" },
          { english: "yellow", vietnamese: "màu vàng", phonetic: "/ˈjɛloʊ/" },
          { english: "pink", vietnamese: "màu hồng", phonetic: "/pɪŋk/" },
        ],
      },
    ],
  },
  {
    grade: 2,
    label: "Lớp 2",
    units: [
      {
        id: "g2-u1",
        name: "Unit 1",
        topic: "Numbers",
        words: [
          { english: "one", vietnamese: "một", phonetic: "/wʌn/" },
          { english: "two", vietnamese: "hai", phonetic: "/tuː/" },
          { english: "three", vietnamese: "ba", phonetic: "/θriː/" },
          { english: "four", vietnamese: "bốn", phonetic: "/fɔːr/" },
          { english: "five", vietnamese: "năm", phonetic: "/faɪv/" },
          { english: "six", vietnamese: "sáu", phonetic: "/sɪks/" },
          { english: "seven", vietnamese: "bảy", phonetic: "/ˈsɛvən/" },
          { english: "eight", vietnamese: "tám", phonetic: "/eɪt/" },
          { english: "nine", vietnamese: "chín", phonetic: "/naɪn/" },
          { english: "ten", vietnamese: "mười", phonetic: "/tɛn/" },
        ],
      },
    ],
  }
);
