// course-tabs.js
// ===============================
// CAMBRIDGE ROADMAP
// ===============================

const courseData = {
  starters: {
    level: "Level 1",
    title: "Cambridge Starters",
    desc: "Làm quen với tiếng Anh thông qua trò chơi, bài hát và các hoạt động tương tác giúp học viên hình thành sự yêu thích với ngoại ngữ.",
    age: "6 - 8 tuổi",
    time: "72 buổi",
    output: "YLE Starters",
    image: "images/courses/starters.jpg",
  },

  movers: {
    level: "Level 2",
    title: "Cambridge Movers",
    desc: "Phát triển phản xạ giao tiếp, mở rộng vốn từ và nâng cao kỹ năng nghe, nói, đọc, viết.",
    age: "8 - 10 tuổi",
    time: "80 buổi",
    output: "YLE Movers",
    image: "images/courses/movers.jpg",
  },

  flyers: {
    level: "Level 3",
    title: "Cambridge Flyers",
    desc: "Hoàn thiện nền tảng tiếng Anh trước bậc THCS, tăng cường khả năng giao tiếp tự nhiên.",
    age: "10 - 12 tuổi",
    time: "90 buổi",
    output: "YLE Flyers",
    image: "images/courses/flyers.jpg",
  },

  ket: {
    level: "A2",
    title: "Cambridge KET",
    desc: "Xây dựng nền tảng học thuật và giao tiếp, sẵn sàng bước vào các kỳ thi quốc tế.",
    age: "12+",
    time: "100 buổi",
    output: "A2 Key",
    image: "images/courses/ket.jpg",
  },

  pet: {
    level: "B1",
    title: "Cambridge PET",
    desc: "Nâng cao khả năng sử dụng tiếng Anh trong học tập và cuộc sống hằng ngày.",
    age: "13+",
    time: "110 buổi",
    output: "B1 Preliminary",
    image: "images/courses/pet.jpg",
  },

  fce: {
    level: "B2",
    title: "Cambridge FCE",
    desc: "Hoàn thiện năng lực tiếng Anh học thuật và giao tiếp ở trình độ trung cao cấp.",
    age: "15+",
    time: "120 buổi",
    output: "B2 First",
    image: "images/courses/fce.jpg",
  },
};

const tabs = document.querySelectorAll(".tab-btn");

const level = document.querySelector(".course-level");

const title = document.getElementById("courseTitle");

const desc = document.getElementById("courseDesc");

const age = document.getElementById("courseAge");

const time = document.getElementById("courseTime");

const output = document.getElementById("courseOutput");

const image = document.getElementById("courseImage");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((btn) => btn.classList.remove("active"));

    tab.classList.add("active");

    const course = courseData[tab.dataset.course];

    level.textContent = course.level;

    title.textContent = course.title;

    desc.textContent = course.desc;

    age.textContent = course.age;

    time.textContent = course.time;

    output.textContent = course.output;

    document.querySelector(".roadmap-content").classList.remove("fade");

    void document.querySelector(".roadmap-content").offsetWidth;

    document.querySelector(".roadmap-content").classList.add("fade");

    image.src = course.image;
    Object.values(courseData).forEach((course) => {
    const img = new Image();
    img.src = course.image;
});
  });
});
