function prepareData(rawData, sprintObj) {
  try {
  // Присвоение id константе
  const sprintId = sprintObj['sprintId'];

  // Сортировка данных в массивы по типу
  const commits = [];
  const comments = [];
  const summary = [];
  const users = [];
  const sprints = [];
  rawData.forEach(element =>{
    if (element.type == 'Comment'){
      comments.push(element)
    } else if (element.type == 'Summary'){
      summary.push(element)
    } else if (element.type == 'Commit'){
      commits.push(element)
      } else if (element.type == 'Sprint'){
      sprints.push(element)
      } else if (element.type == 'User'){
      users.push(element)
      }
    });
  // сортировка спритнов
  sprints.sort((sprintA, sprintB) =>{
    return sprintA.id - sprintB.id
  });

  // экстракция временных границ текущего спринта и его индекса
  let currentSprintStart;
  let currentSprintFinish;
  let currentSprintIndex;
  for (sprint in sprints) {
    if (sprints[sprint].id == sprintId) {
       currentSprintStart = sprints[sprint].startAt;
       currentSprintFinish = sprints[sprint].finishAt;
       currentSprintIndex = sprint
       previousSprintIndex = sprint - 1
       break;
    };
  };

  // Каркас vote
  const vote = {
    "alias": "vote",
    "data": {
      "title": "Самый 🔎 внимательный разработчик",
      "subtitle": "",
      "emoji": "🔎",
      "users": []
    }
  };

  try {
    vote.data.subtitle = sprints[currentSprintIndex].name
  } catch {
    console.log("sprint name is empty")
  }

  // Создание массива и присвоение ему valueText для vote путём перебора массива с комментами и проверок времени
  let voteStatistics = [];
  for (let i = 0; i < users.length + 1; ++i){
    voteStatistics.push(0)
  };

  comments.forEach(comment =>{
    if (comment.createdAt >= currentSprintStart && comment.createdAt <= currentSprintFinish) {
      voteStatistics[comment.author] += comment.likes.length
    }
  });

  // Сборка vote. Добавление пользователей и их valueText 
  users.forEach(user => {
    vote.data.users.push({"id": user.id, "name": user.name, "avatar": user.avatar, "valueText": voteStatistics[user.id] != undefined ? voteStatistics[user.id].toString() : ""})
  });

  vote.data.users.sort((userA, userB) =>{
    return userB.valueText - userA.valueText;
  });
  
  //функция склонения слов,
  //взял отсюда https://realadmin.ru/coding/sklonenie-na-javascript.html
  function declOfNum(n, text_forms) {  
    n = Math.abs(n) % 100; var n1 = n % 10;
    if (n > 10 && n < 20) { return text_forms[2]; }
    if (n1 > 1 && n1 < 5) { return text_forms[1]; }
    if (n1 == 1) { return text_forms[0]; }
    return text_forms[2];
  }

  // добавление просклонённых слов
  vote.data.users.forEach(user => {
    user.valueText += declOfNum(user.valueText, [" голос", " голоса", " голосов"])
  });
  
  

  // каркас leaders
  const leaders = {
  "alias": "leaders",
  "data": {
    "title": "Больше всего коммитов",
    "subtitle": sprints[currentSprintIndex].name,
    "emoji": "👑",
    "users": []
    }
  };
  let border1
  let border2
  for (let i = 0; i < sprints.length; i++) {
    if (sprintId == sprints[i].id) {
      border1 = sprints[i].startAt
      border2 = sprints[i].finishAt
      break
    }
  }

  let usersObj = {}
  commits.forEach(commit => {
    if (commit.timestamp <= border2) {
      if (commit.timestamp >= border1) {
        if (usersObj[commit.author] == undefined) {usersObj[commit.author] = 0}
        usersObj[commit.author] += 1
      }
    }
  })

  let leadersUsers = []
 
  users.forEach(user => {
    leadersUsers.push({"id": user.id, "name": user.name, "avatar": user.avatar, "valueText": usersObj[user.id] != undefined ? `${usersObj[user.id]}` : "0"})
  }) 
  leadersUsers.sort((userA, userB) => {
      if (userA.valueText - userB.valueText == 0 ) {
        return userB.id - userA.id
      } else {
        return +userB.valueText - +userA.valueText
      }
    })
 

  leaders.data.users = JSON.parse(JSON.stringify(leadersUsers))

/*


  // Создание массива и присвоение ему valueText для leaders путём перебора массива с коммитами и проверок времени
  let leadersStatistics = JSON.parse(JSON.stringify(users));
  leadersStatistics.sort((a, b) => {
    return a.id - b.id
  })
  for (let i = 0; i < users.length; ++i){
    leadersStatistics[i].valueText = 0
  };
  commits.forEach(commit =>{
    if (commit.timestamp > currentSprintStart && commit.timestamp < currentSprintFinish) {
      for (let i = 0; i < leadersStatistics.length; i++) {
        if (leadersStatistics[i].id == commit.author) {
          ++leadersStatistics[i].valueText
          break
        }
      }
    }
  });

*/


/*
  // Перенос пользователей в leaders по уменшению valueText

  // добавлене юзерам количества лайков в likes 
  users.forEach(user => {
    user.likes = leadersStatistics[user.id]
  })
  // сортировка по лайкам
  users.sort((userA, userB) => {
    if (userB.likes - userA.likes > 0) {
      return 1
    } else {
      return -1
    }
      // return userB.likes - userA.likes
  })

  // сбор users 
  for (let i = 0; i < users.length; ++i){
    let userToAdd = {"id": users[i].id, "name": users[i].name, "avatar": users[i].avatar, "valueText": users[i].likes.toString()};
    leaders.data.users.push(userToAdd);
  }
*/

  // Перенос пользователей в leaders по уменшению valueText

  // Сортировка users по id, чтобы индекс в users соотносился с индексом в leadersStatistics

  // for (let i = 0; i < users.length; ++i){
  //   let maxValue = Math.max(...leadersStatistics);
  //   let userId = leadersStatistics.indexOf(maxValue);
  //   let userToAdd = {"id": users[userId - 1].id, "name": users[userId - 1].name, "avatar": users[userId - 1].avatar, "valueText": maxValue != undefined ? maxValue.toString() : ""};
  //   leaders.data.users.push(JSON.parse(JSON.stringify(userToAdd)));
  //   leadersStatistics[userId] = -1;
  // };


/*
    leaders.data.users = JSON.parse(JSON.stringify(leadersStatistics));
    leaders.data.users.forEach(user => {
      delete user.friends
      delete user.comments
      delete user.commits
      delete user.login
      delete user.type
      user.valueText = user.valueText.toString()
    })
    leaders.data.users.sort((userA, userB) => {
      if (userA.valueText - userB.valueText == 0 ) {
        return userA.id - userB.id
      } else {
        return +userB.valueText - +userA.valueText
      }
    })
*/

  // каркас chart
  const chart = {
    "alias": "chart",
    "data": {
      "title": "Коммиты",
      "subtitle": sprints[currentSprintIndex].name,
      "values": [],
    "users": []
    }
  };


  // Создание commits в sprints для количесва коммитов
  for (sprint in sprints){
    sprints[sprint].commits = 0;
    // создание эл-тов содержащих данные для diagram
    if (sprint == currentSprintIndex || sprint == currentSprintIndex - 1){

      sprints[sprint].tinyCommits = 0;
      sprints[sprint].smallCommits = 0;
      sprints[sprint].bigCommits = 0;
      sprints[sprint].hugeCommits = 0;

      // бесконечности необходимы для установки границ текущего и предыдущего спритов
      sprints[sprint].firstSummary = Number.POSITIVE_INFINITY;
      sprints[sprint].lastSummary = Number.NEGATIVE_INFINITY;
    } 
  }

  // объекты для коммитов текущего и предыдущего спринтов. Необходимы для diagram и activity
  let currentSprintCommits = [];
  let previousSprintCommits = [];



  // Функция бинарного поиска, ищущая к какому спринту относится коммит, немного быстрее 
  // простого перебора, будет намного быстрее при большем количесте спринтов
  let binarySearch = (commit) =>{
    let left = -1;
    let right = sprints.length + 1;
    let middle = Math.floor((left + right) / 2);
    let i = Math.ceil(Math.log2(sprints.length) + 2)
    while (i != 0) {
      i--
      if (commit.timestamp < sprints[middle].startAt) { //если время меньше меньшей границы
        right = middle;
        middle = Math.floor((left + right) / 2);
      } else if (commit.timestamp > sprints[middle].finishAt) { //если время больше большей
        left = middle;
        middle = Math.floor((left + right) / 2);
      } else {

        // передача в текущий и предыдущий спринт данных для diagram
        // передача в спринт id крайних summary 
        // вынесение коммитов текущего и предыдущего спритнов в отдельные массивы
        if (middle == currentSprintIndex) {
          currentSprintCommits.push(commit) //вынесение 
          if (commit.summaries[commit.summaries.length - 1] >= sprints[currentSprintIndex].lastSummary){
            sprints[currentSprintIndex].lastSummary = commit.summaries[commit.summaries.length - 1]
          }
          if (commit.summaries[0] < sprints[currentSprintIndex].firstSummary){
            sprints[currentSprintIndex].firstSummary = commit.summaries[0]
          }
        } else if (middle == currentSprintIndex - 1) { 
            previousSprintCommits.push(commit); //вынесение
            if (commit.summaries[commit.summaries.length - 1] >= sprints[currentSprintIndex - 1].lastSummary){
              sprints[currentSprintIndex - 1].lastSummary = commit.summaries[commit.summaries.length - 1]
            }
            if (commit.summaries[0] < sprints[currentSprintIndex - 1].firstSummary){
              sprints[currentSprintIndex - 1].firstSummary = commit.summaries[0]
            }
        }

        return middle //возвращает индекс спритна, к которому относится коммит
      }
    }
  };

  // перебор, после тестов отказался от перебора в пользу бинарки 
  let search = (commit) =>{
    sprints.forEach(sprint =>{
      if (commit.timestamp >= sprint.startAt && commit.timestamp <= sprint.finishAt){
          if (commit.id == sprints[currentSprintIndex]) {
          currentSprintCommits.push(commit) //вынесение 
          if (commit.summaries[commit.summaries.length - 1] >= sprints[currentSprintIndex].lastSummary){
            sprints[currentSprintIndex].lastSummary = commit.summaries[commit.summaries.length - 1]
          }
          if (commit.summaries[0] < sprints[currentSprintIndex].firstSummary){
            sprints[currentSprintIndex].firstSummary = commit.summaries[0]
          }
        } else if (commit.id == sprints[currentSprintIndex - 1]) { 
            previousSprintCommits.push(commit); //вынесение
            if (commit.summaries[commit.summaries.length - 1] >= sprints[currentSprintIndex - 1].lastSummary){
              sprints[currentSprintIndex - 1].lastSummary = commit.summaries[commit.summaries.length - 1]
            }
            if (commit.summaries[0] < sprints[currentSprintIndex - 1].firstSummary){
              sprints[currentSprintIndex - 1].firstSummary = commit.summaries[0]
            }
        }
        return sprints.indexOf(sprint)
      }
    })
    return false
  };
  // подсчёт количества коммитов в каждом спринте
  

  commits.forEach(commit =>{
    sprints[binarySearch(commit)].commits += 1
  });

  // сбор values в chart
  sprints.forEach(sprint =>{
    chart.data.values.push({"title": sprint.id.toString(), "hint": sprint.name, "value": sprint.commits})
  });

  // добавление "actuve": true
  for (element in chart.data.values){
    if (chart.data.values[element].title == sprintId){
      chart.data.values[element].active = true;
      break;
    }
  }
  

  // добавление users, копирование из leaders
  // chart.data.users = leaders.data.users.slice();
  chart.data.users = JSON.parse(JSON.stringify(leaders.data.users));
  // Начало зоны 4 подзадания
  
  // добавление счётчиков коммитов для текущего и предыдущего спринтов
  sprints[currentSprintIndex].tinyCommits = 0;
  sprints[currentSprintIndex].smallCommits = 0;
  sprints[currentSprintIndex].bigCommits = 0;
  sprints[currentSprintIndex].hugeCommits = 0;
  sprints[currentSprintIndex - 1].tinyCommits = 0;
  sprints[currentSprintIndex - 1].smallCommits = 0;
  sprints[currentSprintIndex - 1].bigCommits = 0;
  sprints[currentSprintIndex - 1].hugeCommits = 0;

  // сортировка массивов текущих и предыдущих коммитов
  currentSprintCommits.sort((a, b) => {
    if (a.summaries.length != 0 && b.summaries.length != 0){
      return b.summaries[0] - a.summaries[0]
    }
    return 0
  })

  previousSprintCommits.sort((a, b) => {
    if (a.summaries.length != 0 && b.summaries.length != 0){
      return b.summaries[0] - a.summaries[0]
    }
    return 0
  })


  // копирование current SprintCommits и удаление из оригинальных массивов нулевых коммитов
  // Копия нужна для последней подзадачи, нули мешают бинарному поиску
  let currentSprintCommitsWithEmptyCommits = JSON.parse(JSON.stringify(currentSprintCommits))
  currentSprintCommits.forEach(commit =>{
  if (commit.summaries.length == 0) {
    currentSprintCommits.splice(currentSprintCommits.indexOf(commit), 1)
    }
  })

  previousSprintCommits.forEach(commit =>{
    if (commit.summaries.length == 0) {
      previousSprintCommits.splice(previousSprintCommits.indexOf(commit), 1)
    }
  })



  // добавление в объекты с коммитами текущих и предыдущих спринтов значений размера коммита
   currentSprintCommits.forEach(commit => {
    commit.commitSize = 0
   })
   previousSprintCommits.forEach(commit => {
    commit.commitSize = 0
   })



  // бинарный поиск пренадлежности summary к определённому commit



  // функция проверки наличия sumarry в коммите
  let hasSummary = (commit, summary) => {
    for (summaryInCommit in commit.summaries) {
      if (commit.summaries[summaryInCommit] == summary) {
        return true;
      }
    }
    return false;
  }

  // ф-ии сравнения summaries коммита и summary
  let summaryIsMore = (commit, summary) => {
    for (summaryInCommit in commit.summaries) {
      if (commit.summaries[summaryInCommit] >= summary) {
        return false
      }
    }
    return true
  }

  let summaryIsLess = (commit, summary) => {
    for (summaryInCommit in commit.summaries) {
      if (commit.summaries[summaryInCommit] <= summary) {
        return false
      }
    }
    return true
  }

  // переменная, нужная для того, чтобы убирать зацикливание при поиске элементов,
  // которые входят в границы sprints[currentSprintIndex].firstSummary и sprints[currentSprintIndex].lastSummary 
  // но в не находятся ни в каком коммите из этого спринта
  const searchCommitLimiter = Math.ceil(Math.log2(currentSprintCommits.length) + 2)

  // Определяет к какому коммиту относится суммари и добавляет её к размеру этого коммита
  let binarySearchCommit = (summaryElement, sprintArray) => {
    let counter = searchCommitLimiter
    let left = 0;
    let right = sprintArray.length;
    let middle = Math.floor((left + right) / 2);
    while (counter != 0) {
      if (summaryIsLess(sprintArray[middle], summaryElement.id)) { 
        left = middle
        middle = Math.floor((left + right) / 2);
      } else if (summaryIsMore(sprintArray[middle], summaryElement.id)) {
        right = middle;
        middle = Math.floor((left + right) / 2);
      } else {
         sprintArray[middle].commitSize += summaryElement.added + summaryElement.removed
         break
      }
      counter--
      }
    }

  // перебор массива с summary, проверка вхождения суммари в временные границы спринта и 
  // нахождение размеров коммитов           (нелегка была 4 подзадача, это уж точно)
  summary.forEach(summ => {
    if ( //проверка того, входит ли summary в границы спринта
      summ.id <= sprints[currentSprintIndex].lastSummary && 
      summ.id >= sprints[currentSprintIndex].firstSummary
      ) { // инициализация поиска 
        binarySearchCommit(summ, currentSprintCommits)
    } else if (
      summ.id <= sprints[previousSprintIndex].lastSummary &&
      summ.id >= sprints[previousSprintIndex].firstSummary
      ) {
        binarySearchCommit(summ, previousSprintCommits)
    }
  });

  // Подсчёт коммитов разных размеров

  /*
    сумма нижеперечисленных коммитов может оказаться меньше общей суммы commits,
    так как коммиты с нулём изменений всё ещё засчитываются как коммиты
    но они не подходят ни в какую категорию из нижеперечисленных.
    По макету указан размер коммитов 1 - 100 строк.
    Итак, нулевые коммиты не входят в расшифровку по строкам, но входят
    в общее количество коммитов и изменения с прошлого спринта, поэтому 
    возможны ситуации типа (всего 5 коммитов!) и по одному коммиту в расшифровке.
    Я не виноват! Про то, что с этим делать не сказано в тз! 
  */
  currentSprintCommits.forEach(commit => {
    if (commit.commitSize > 1000) {
      sprints[currentSprintIndex].hugeCommits += 1
    } else if (commit.commitSize > 500) {
      sprints[currentSprintIndex].bigCommits += 1
    } else if (commit.commitSize > 100) {
      sprints[currentSprintIndex].smallCommits += 1
    } else if (commit.commitSize > 0 ) {
      sprints[currentSprintIndex].tinyCommits += 1
    }
  })

  previousSprintCommits.forEach(commit => {
    if (commit.commitSize > 1000) {
      sprints[previousSprintIndex].hugeCommits += 1
    } else if (commit.commitSize > 500) {
      sprints[previousSprintIndex].bigCommits += 1
    } else if (commit.commitSize > 100) {
      sprints[previousSprintIndex].smallCommits += 1
    } else if (commit.commitSize > 0 ) {
      sprints[previousSprintIndex].tinyCommits += 1
    }
  })

  // определение и заполнение диаграммы

  // Ф-ия добавляющая знак + к числу 
  function getSign(Num) {
    if (Num > 0){
      return "+" + Num;
    } else {
      return Num;
    }
  }

  // определение differenceNumber
  const differenceNumber = sprints[currentSprintIndex].commits - sprints[previousSprintIndex].commits
  // console.log(sprints[currentSprintIndex].commits)
  // console.log(sprints[currentSprintIndex].hugeCommits +
  //   sprints[currentSprintIndex].bigCommits +
  //   sprints[currentSprintIndex].smallCommits +
  //   sprints[currentSprintIndex].tinyCommits
  //   )
  const diagram = {
      "alias": "diagram",
      "data": {
        "title": "Размер коммитов",
        "subtitle": sprints[currentSprintIndex].name,
        "totalText": `${sprints[currentSprintIndex].commits} ${declOfNum(sprints[currentSprintIndex].commits, ["коммит", "коммита", "коммитов"])}`,
        "differenceText": `${getSign(differenceNumber)} с прошлого спринта`,
        "categories": [
          {
            "title": "> 1001 строки",
            "valueText": `${sprints[currentSprintIndex].hugeCommits} ${declOfNum(sprints[currentSprintIndex].hugeCommits, ["коммит", "коммита", "коммитов"])}`,
              "differenceText": `${getSign(sprints[currentSprintIndex].hugeCommits - sprints[previousSprintIndex].hugeCommits)} ${declOfNum(sprints[currentSprintIndex].hugeCommits - sprints[previousSprintIndex].hugeCommits, ["коммит", "коммита", "коммитов"])}`
        },
          {
            "title": "501 — 1000 строк", 
            "valueText": `${sprints[currentSprintIndex].bigCommits} ${declOfNum(sprints[currentSprintIndex].bigCommits, ["коммит", "коммита", "коммитов"])}`,
            "differenceText": `${getSign(sprints[currentSprintIndex].bigCommits - sprints[previousSprintIndex].bigCommits)} ${declOfNum(sprints[currentSprintIndex].bigCommits - sprints[previousSprintIndex].bigCommits, ["коммит", "коммита", "коммитов"])}`
          },
          {
            "title": "101 — 500 строк",
            "valueText": `${sprints[currentSprintIndex].smallCommits} ${declOfNum(sprints[currentSprintIndex].smallCommits, ["коммит", "коммита", "коммитов"])}`,
            "differenceText": `${getSign(sprints[currentSprintIndex].smallCommits - sprints[previousSprintIndex].smallCommits)} ${declOfNum(sprints[currentSprintIndex].smallCommits - sprints[previousSprintIndex].smallCommits, ["коммит", "коммита", "коммитов"])}`},
          {
            "title": "1 — 100 строк",
            "valueText": `${sprints[currentSprintIndex].tinyCommits} ${declOfNum(sprints[currentSprintIndex].tinyCommits, ["коммит", "коммита", "коммитов"])}`,
            "differenceText": `${getSign(sprints[currentSprintIndex].tinyCommits - sprints[previousSprintIndex].tinyCommits)} ${declOfNum(sprints[currentSprintIndex].tinyCommits - sprints[previousSprintIndex].tinyCommits, ["коммит", "коммита", "коммитов"])}`}
        ]
      }}

  // не знаю, почему новые спринты начинаются в воскресенье в 0:05:02, 
  // получается, что последний столбец sum на самом деле - первый день спринта, а первый столбец - второй день

  const activityStat = []
    for (let i = 0; i < 7; ++i) {
      activityStat.push([])
      for (let j = 0; j < 24; ++j) {
        activityStat[i].push(0)
      }
    }

    // Сбор статистики по дням недели
  currentSprintCommitsWithEmptyCommits.forEach(commit => {
    let time = new Date(commit.timestamp)
    let dayWeek = [0, 1, 2, 3, 4, 5, 6][time.getDay()]
    activityStat[dayWeek][time.getHours()] += 1 
  });

  const activity = {
    "alias": "activity",
    "data": {
      "title": `Коммиты, ${+currentSprintIndex + 1} неделя`,
      "subtitle": sprints[currentSprintIndex].name,
      "data": {
        "mon": activityStat[1],
        "tue": activityStat[2],
        "wed": activityStat[3],
        "thu": activityStat[4],
        "fri": activityStat[5],
        "sat": activityStat[6],
        "sun": activityStat[0]
      }
    }
  }        
  return JSON.parse(JSON.stringify([leaders, vote, chart, diagram, activity])); 

} catch(c) {
    console.log(c)
    return []
  }

};

module.exports = { prepareData };
