// ======================================
// CAMBRIDGE / IELTS COURSE TABS
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = Array.from(
    document.querySelectorAll(".tab-btn[data-course]"),
  );

  const courseImage = document.getElementById("courseImage");
  const courseLevel = document.querySelector(".course-level");
  const courseTitle = document.getElementById("courseTitle");
  const courseDesc = document.getElementById("courseDesc");
  const courseAge = document.getElementById("courseAge");
  const courseOutput = document.getElementById("courseOutput");

  if (
    tabButtons.length === 0 ||
    !courseImage ||
    !courseLevel ||
    !courseTitle ||
    !courseDesc ||
    !courseAge ||
    !courseOutput
  ) {
    console.warn("Không tìm thấy đầy đủ thành phần của khu vực chương trình.");

    return;
  }

  const courses = {
    "pre-starters": {
      level: "Foundation",
      title: "Pre-Starters",
      desc: "Chương trình làm quen tiếng Anh dành cho học viên nhỏ tuổi, giúp xây dựng nền tảng từ vựng, phát âm và phản xạ giao tiếp thông qua trò chơi, bài hát và hoạt động tương tác.",
      age: "4–6 tuổi",
      output: "Nền tảng Pre-A1",
      image: "images/courses/starters.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình tiếng Anh Pre-Starters",
    },

    starters: {
      level: "Pre-A1",
      title: "Cambridge Starters",
      desc: "Giúp học viên hình thành nền tảng tiếng Anh thông qua từ vựng, phát âm, trò chơi và các hoạt động giao tiếp phù hợp với độ tuổi.",
      age: "6–8 tuổi",
      output: "YLE Starters",
      image: "images/courses/starters.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình Cambridge Starters",
    },

    movers: {
      level: "A1",
      title: "Cambridge Movers",
      desc: "Phát triển khả năng nghe, nói, đọc và viết, đồng thời tăng phản xạ sử dụng tiếng Anh trong các tình huống quen thuộc.",
      age: "8–10 tuổi",
      output: "YLE Movers",
      image: "images/courses/movers.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình Cambridge Movers",
    },

    flyers: {
      level: "A2",
      title: "Cambridge Flyers",
      desc: "Củng cố toàn diện bốn kỹ năng và giúp học viên sử dụng tiếng Anh tự tin hơn trong học tập và giao tiếp.",
      age: "10–12 tuổi",
      output: "YLE Flyers",
      image: "images/courses/flyers.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình Cambridge Flyers",
    },

    ket: {
      level: "A2",
      title: "Cambridge KET",
      desc: "Phát triển năng lực tiếng Anh nền tảng và chuẩn bị cho kỳ thi Cambridge A2 Key với lộ trình học rõ ràng.",
      age: "12 tuổi trở lên",
      output: "A2 Key",
      image: "images/courses/ket.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình Cambridge KET",
    },

    pet: {
      level: "B1",
      title: "Cambridge PET",
      desc: "Nâng cao khả năng sử dụng tiếng Anh độc lập trong học tập, giao tiếp và các tình huống thực tế.",
      age: "13 tuổi trở lên",
      output: "B1 Preliminary",
      image: "images/courses/pet.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình Cambridge PET",
    },

    ielts: {
      level: "IELTS Foundation → Advanced",
      title: "Luyện thi IELTS",
      desc: "Phát triển toàn diện Listening, Speaking, Reading và Writing, kết hợp chiến lược làm bài theo mục tiêu điểm số của từng học viên.",
      age: "15 tuổi trở lên",
      output: "IELTS theo mục tiêu",
      image: "images/courses/fce.webp",
      fallbackImage: "images/courses/starters.webp",
      alt: "Chương trình luyện thi IELTS",
    },
  };

  let latestChangeId = 0;

  /**
   * Cập nhật trạng thái nút đang chọn.
   */
  function updateActiveButton(selectedButton) {
    tabButtons.forEach((button) => {
      const isSelected = button === selectedButton;

      button.classList.toggle("active", isSelected);
      button.setAttribute("aria-selected", String(isSelected));
      button.setAttribute("tabindex", isSelected ? "0" : "-1");
    });
  }

  /**
   * Cập nhật ảnh nhưng không làm hỏng thao tác chuyển tab
   * khi đường dẫn ảnh không tồn tại.
   */
  function updateCourseImage(course, changeId) {
    const newImage = new Image();

    newImage.onload = () => {
      if (changeId !== latestChangeId) {
        return;
      }

      courseImage.src = course.image;
      courseImage.alt = course.alt;

      courseImage.animate(
        [
          {
            opacity: 0.25,
          },
          {
            opacity: 1,
          },
        ],
        {
          duration: 280,
          easing: "ease-out",
        },
      );
    };

    newImage.onerror = () => {
      if (changeId !== latestChangeId) {
        return;
      }

      /*
       * Nếu ảnh riêng của khóa học bị thiếu,
       * vẫn chuyển nội dung và dùng ảnh Starters tạm thời.
       */
      courseImage.src = course.fallbackImage;
      courseImage.alt = `${course.alt} - ảnh minh họa`;
    };

    newImage.src = course.image;
  }

  /**
   * Hiển thị một chương trình.
   */
  function showCourse(courseKey, selectedButton) {
    const course = courses[courseKey];

    if (!course) {
      console.warn(`Không có dữ liệu khóa học: ${courseKey}`);
      return;
    }

    latestChangeId += 1;

    const currentChangeId = latestChangeId;

    updateActiveButton(selectedButton);

    /*
     * Nội dung được đổi ngay lập tức.
     * Không chờ ảnh tải xong.
     */
    courseLevel.textContent = course.level;
    courseTitle.textContent = course.title;
    courseDesc.textContent = course.desc;
    courseAge.textContent = course.age;
    courseOutput.textContent = course.output;

    updateCourseImage(course, currentChangeId);
  }

  tabButtons.forEach((button, buttonIndex) => {
    button.addEventListener("click", () => {
      const courseKey = button.dataset.course;

      showCourse(courseKey, button);
    });

    /*
     * Điều hướng tab bằng phím trái/phải.
     */
    button.addEventListener("keydown", (event) => {
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }

      event.preventDefault();

      let nextIndex = buttonIndex;

      if (event.key === "ArrowRight") {
        nextIndex = (buttonIndex + 1) % tabButtons.length;
      }

      if (event.key === "ArrowLeft") {
        nextIndex = (buttonIndex - 1 + tabButtons.length) % tabButtons.length;
      }

      if (event.key === "Home") {
        nextIndex = 0;
      }

      if (event.key === "End") {
        nextIndex = tabButtons.length - 1;
      }

      const nextButton = tabButtons[nextIndex];

      nextButton.focus();
      nextButton.click();
    });
  });

  /*
   * Khởi tạo bằng nút đang có class active.
   * Nếu không có, sử dụng nút đầu tiên.
   */
  const initialButton =
    tabButtons.find((button) => button.classList.contains("active")) ||
    tabButtons[0];

  showCourse(initialButton.dataset.course, initialButton);
});
