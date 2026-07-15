// ===============================
// CAMBRIDGE COURSE TABS
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const courseData = Object.freeze({
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
  });

  const tabList = document.querySelector(".roadmap-tabs");
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));

  const roadmapContent = document.querySelector(".roadmap-content");
  const roadmapImage = document.querySelector(".roadmap-image");
  const roadmapInfo = document.querySelector(".roadmap-info");

  const levelElement = document.querySelector(".course-level");
  const titleElement = document.getElementById("courseTitle");
  const descriptionElement = document.getElementById("courseDesc");
  const ageElement = document.getElementById("courseAge");
  const timeElement = document.getElementById("courseTime");
  const outputElement = document.getElementById("courseOutput");
  const imageElement = document.getElementById("courseImage");

  const requiredElements = [
    tabList,
    roadmapContent,
    roadmapImage,
    roadmapInfo,
    levelElement,
    titleElement,
    descriptionElement,
    ageElement,
    timeElement,
    outputElement,
    imageElement,
  ];

  if (tabs.length === 0 || requiredElements.some((element) => !element)) {
    console.warn("Không tìm thấy đầy đủ thành phần Cambridge Roadmap.");
    return;
  }

  const imageCache = new Map();
  let activeCourse =
    document.querySelector(".tab-btn.active")?.dataset.course || "starters";

  let latestRequest = 0;

  /**
   * Tải trước ảnh và lưu Promise vào bộ nhớ.
   */
  function preloadImage(source) {
    if (imageCache.has(source)) {
      return imageCache.get(source);
    }

    const imagePromise = new Promise((resolve, reject) => {
      const preload = new Image();

      preload.onload = async () => {
        try {
          if (typeof preload.decode === "function") {
            await preload.decode();
          }
        } catch (error) {
          // Ảnh đã tải được nên vẫn tiếp tục dù decode thất bại.
        }

        resolve(source);
      };

      preload.onerror = () => {
        reject(new Error(`Không tải được ảnh: ${source}`));
      };

      preload.src = source;
    });

    imageCache.set(source, imagePromise);

    return imagePromise;
  }

  /**
   * Cập nhật trạng thái active và accessibility của tab.
   */
  function updateActiveTab(selectedTab) {
    tabs.forEach((tab) => {
      const isSelected = tab === selectedTab;

      tab.classList.toggle("active", isSelected);
      tab.setAttribute("aria-selected", String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });
  }

  /**
   * Cập nhật nội dung khóa học.
   */
  function updateCourseContent(course) {
    levelElement.textContent = course.level;
    titleElement.textContent = course.title;
    descriptionElement.textContent = course.desc;
    ageElement.textContent = course.age;
    timeElement.textContent = course.time;
    outputElement.textContent = course.output;

    imageElement.src = course.image;
    imageElement.alt = `${course.title} tại Đăng Lưu English Center`;
  }

  /**
   * Tạo hiệu ứng đổi nội dung nhẹ, không dùng transform.
   */
  function animateCourseContent() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return;
    }

    [roadmapImage, roadmapInfo].forEach((element) => {
      element.getAnimations().forEach((animation) => {
        animation.cancel();
      });

      element.animate(
        [
          {
            opacity: 0.45,
          },
          {
            opacity: 1,
          },
        ],
        {
          duration: 240,
          easing: "ease-out",
          fill: "both",
        },
      );
    });
  }

  /**
   * Chọn và hiển thị một khóa học.
   */
  async function selectCourse(tab) {
    const courseKey = tab.dataset.course;
    const course = courseData[courseKey];

    if (!course) {
      console.warn(`Không tìm thấy dữ liệu khóa học: ${courseKey}`);
      return;
    }

    if (courseKey === activeCourse && tab.classList.contains("active")) {
      return;
    }

    const requestId = ++latestRequest;

    updateActiveTab(tab);

    try {
      await preloadImage(course.image);
    } catch (error) {
      console.warn(error.message);
    }

    // Người dùng đã bấm sang tab khác trong lúc ảnh đang tải.
    if (requestId !== latestRequest) {
      return;
    }

    activeCourse = courseKey;

    updateCourseContent(course);
    animateCourseContent();
  }

  /**
   * Hỗ trợ điều hướng tab bằng bàn phím.
   */
  function handleTabKeyboard(event, currentIndex) {
    const navigationKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];

    if (!navigationKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    let targetIndex = currentIndex;

    if (event.key === "ArrowRight") {
      targetIndex = (currentIndex + 1) % tabs.length;
    }

    if (event.key === "ArrowLeft") {
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (event.key === "Home") {
      targetIndex = 0;
    }

    if (event.key === "End") {
      targetIndex = tabs.length - 1;
    }

    const targetTab = tabs[targetIndex];

    targetTab.focus();
    selectCourse(targetTab);
  }

  // Thiết lập ARIA cho vùng tab.
  tabList.setAttribute("role", "tablist");
  roadmapContent.setAttribute("role", "tabpanel");

  tabs.forEach((tab, index) => {
    const isActive = tab.dataset.course === activeCourse;

    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;

    tab.addEventListener("click", () => {
      selectCourse(tab);
    });

    tab.addEventListener("keydown", (event) => {
      handleTabKeyboard(event, index);
    });
  });

  // Tải trước ảnh một lần duy nhất khi trang khởi tạo.
  Object.values(courseData).forEach((course) => {
    preloadImage(course.image).catch((error) => {
      console.warn(error.message);
    });
  });
});
