const audio = document.getElementsByTagName("audio")[0];
const tracks = [
  "cafe",
  "go",
  "party",
  "soothing",
  "slow",
  "traffic",
  "panorama",
];

let track = 0;
audio.addEventListener("ended", (e) => {
  track = track == tracks.length - 1 ? 0 : track + 1;
  audio.src = `./soundtrack/${tracks[track]}.wav`;
  audio.play();
});

const shuffle = (array, elements = array.length) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = ~~(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array.slice(0, elements);
};

const resultEl = document.getElementById("result");
const currentStreakEl = document.getElementById("current-streak");
const highestStreakEl = document.getElementById("highest-streak");
const skippedEl = document.getElementById("skipped");
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answers");
const answeredCorrectlyEl = document.getElementById("answered-correctly");
const questionsAnsweredEl = document.getElementById("total-answered");
const iconClasses = ["fa-square", "fa-star", "fa-diamond", "fa-circle"];

const stats = {
  asked: 0,
  answered: 0,
  answered_correctly: 0,
  current_streak: 0,
  highest_streak: 0,
};

let questions = [];
let currentQuestionId = null;
let wait = false;
setQuestions();

async function fetchQuestions() {
  try {
    const response = await fetch("https://opentdb.com/api.php?amount=50");
    let data = await response?.json();
    return data;
  } catch (err) {
    console.log(err);
    return {
      results: [
        {
          question: "whats my name",
          correct_answer: "eisenberg",
          incorrect_answers: ["yahoo", "bugs", "sharks"],
        },
        {
          question: "whats your name",
          correct_answer: "yahoo",
          incorrect_answers: ["eisenberg", "bugs", "sharks"],
        },
        {
          question: "",
          correct_answer: "eisenberg",
          incorrect_answers: ["yahoo", "bugs", "sharks"],
        },
      ],
    };
  }
}

function getRandomQuestion(questions) {
  const unansweredQuestions = questions.filter((r) => !r.asked);
  const randomNumber = ~~(Math.random() * unansweredQuestions.length);
  return unansweredQuestions[randomNumber];
}

function setQuestions() {
  fetchQuestions().then((data) => {
    questions = data.results?.map((r, i) => ({ ...r, id: i, asked: false }));
    displayQuestion(questions);
  });
}

function displayQuestion(questions) {
  if (!questions || questions.length === 0) {
    questionEl.innerText = "D: Unable to get questions.";
    return;
  }

  const question = getRandomQuestion(questions);
  question.asked = true;
  stats.asked += 1;
  currentQuestionId = question.id;
  questionEl.innerHTML = question.question;

  const answers = shuffle([
    question.correct_answer,
    ...question.incorrect_answers,
  ]);

  answers.forEach((answer, i) => createAnswer(question, answer, i));
}

function createAnswer(question, a, i) {
  const div = document.createElement("div");
  div.classList.add("answer");
  div.classList.add("box");

  div.tabIndex = 0;
  div.addEventListener("click", onAnswerClick);
  div.classList.add(`${currentQuestionId}`);

  const icon = document.createElement("i");
  icon.classList.add("fa-solid");
  icon.classList.add(iconClasses[i]);
  div.append(icon);

  const ans = document.createElement("p");
  ans.innerHTML = a;
  if (a === question.correct_answer) {
    question.correct_answer = ans.innerHTML;
  }
  div.append(ans);

  answerEl.append(div);
}

function onAnswerClick(e) {
  if (wait) return;
  wait = true;

  stats.answered += 1;

  const { innerHTML, style } = [...e.target.childNodes][1];
  const q = questions.find(({ id }) => id == currentQuestionId);
  questionsAnsweredEl.innerText = stats.answered;

  if (q.correct_answer.toLowerCase() === innerHTML.toLowerCase()) {
    // Answered correctly
    // Update stats
    stats.answered_correctly += 1;
    stats.current_streak += 1;
    answeredCorrectlyEl.innerText = stats.answered_correctly;

    // Update correct background
    style.background = "#74f55b";
  } else {
    // Answered incorrectly
    // Update stats
    stats.current_streak = 0;

    // Find correct answer position
    const correctAnswerPosition = [...answerEl.childNodes].findIndex((el) => {
      console.log({
        a: el.childNodes[1].innerHTML.toLowerCase(),
        b: q.correct_answer.toLowerCase(),
      });

      return (
        el.childNodes[1].innerHTML.toLowerCase() ===
        q.correct_answer.toLowerCase()
      );
    });

    // Update correct and incorrect answer background
    const correctAnswer = answerEl.childNodes
      .item(correctAnswerPosition)
      .childNodes.item(1);

    correctAnswer.style.background = "#74f55b";
    style.background = "#ff0040";
  }

  stats.highest_streak =
    stats.current_streak > stats.highest_streak
      ? stats.current_streak
      : stats.highest_streak;

  highestStreakEl.innerText = stats.highest_streak;
  currentStreakEl.innerText = stats.current_streak;

  const waitForNextQuestion = setTimeout(() => {
    wait = false;
    getNewQuestion();
    clearTimeout(waitForNextQuestion);
  }, 2000);
}

const getNewQuestion = () => {
  if (wait) return;
  skippedEl.innerText = stats.asked - stats.answered;

  const previousAnswers = answerEl.querySelectorAll("div");
  previousAnswers.forEach((ans) => {
    answerEl.removeChild(ans);
  });

  if (stats.asked > 0 && stats.asked % 50 === 0) {
    setQuestions();
    return;
  }

  displayQuestion(questions);
};
