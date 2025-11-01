let library = [];
let currentFilter = 'all';

// ================= Поиск книг =================
async function searchBook() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Введите название книги!");

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const data = await response.json();

    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      resultsContainer.innerHTML = "<p>Ничего не найдено 😢</p>";
      return;
    }

    data.items.forEach(item => {
      const info = item.volumeInfo;
      const title = info.title || "Без названия";
      const authors = info.authors ? info.authors.join(", ") : "Автор неизвестен";
      const description = info.description || "Описание отсутствует";
      const imageUrl = info.imageLinks && info.imageLinks.thumbnail 
                       ? info.imageLinks.thumbnail.replace("http:", "https:") 
                       : "https://via.placeholder.com/150x220?text=Нет+обложки";

      const bookDiv = document.createElement("div");
      bookDiv.className = "book";
      bookDiv.innerHTML = `
        <img src="${imageUrl}" alt="${title}">
        <h3>${title}</h3>
        <p>${authors}</p>
      `;

      const btn = document.createElement("button");
      btn.className = "fancy-btn add";
      btn.textContent = "Добавить";

      // Сохраняем данные в dataset
      btn.dataset.title = title;
      btn.dataset.authors = authors;
      btn.dataset.image = imageUrl;
      btn.dataset.desc = description;

      btn.addEventListener("click", () => {
        library.push({
          key: item.id, // Google Books id
          title: btn.dataset.title,
          author: btn.dataset.authors,
          desc: btn.dataset.desc,
          image: btn.dataset.image,
          read: false,
          favorite: false,
          rating: 0,
          isExpanded: false // Track expanded state
        });
        renderLibrary();
        closeModal();
      });

      bookDiv.appendChild(btn);
      resultsContainer.appendChild(bookDiv);
    });

    document.getElementById("searchResultsModal").classList.remove("hidden");

  } catch(err) {
    console.error(err);
    alert("Ошибка при поиске книги");
  }
}

// ================= Добавление книги =================
async function addBookFromInternet(workKey, imageUrl, fallbackTitle, fallbackAuthors) {
  try {
    let title = fallbackTitle;
    let authors = fallbackAuthors;
    let description = "Описание отсутствует";

    // Если есть ключ книги, пробуем получить данные с OpenLibrary
    if (workKey) {
      try {
        const response = await fetch(`https://openlibrary.org${workKey}.json`);
        const workData = await response.json();

        title = workData.title || title;
        description = workData.description ? 
          (typeof workData.description === 'string' ? workData.description : workData.description.value) 
          : description;

        if (workData.authors && workData.authors.length > 0) {
          authors = await fetchAuthors(workData.authors);
        }

        // Проверка обложки
        if (workData.covers && workData.covers.length > 0) {
          imageUrl = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
        }

      } catch (err) {
        console.warn("Не удалось получить полное описание книги, используем данные поиска");
      }
    }

    // На всякий случай заменяем спецсимволы в imageUrl
    if (!imageUrl || imageUrl.includes("placeholder")) {
      imageUrl = "https://via.placeholder.com/150x220?text=Нет+обложки";
    }

    library.push({
      key: workKey,
      title,
      author: authors,
      desc: description,
      image: imageUrl,
      read: false,
      favorite: false,
      rating: 0,
      isExpanded: false // Track expanded state
    });

    renderLibrary();
    closeModal();
  } catch (err) {
    console.error(err);
    alert("Не удалось добавить книгу");
  }
}

// ================= Получение авторов =================
async function fetchAuthors(authorsArray) {
  const names = [];
  for (const a of authorsArray) {
    try {
      const res = await fetch(`https://openlibrary.org${a.author.key}.json`);
      const data = await res.json();
      names.push(data.name);
    } catch(err) {
      names.push("Неизвестный автор");
    }
  }
  return names.join(", ");
}

// ================= Закрыть модалку =================
function closeModal() {
  document.getElementById("searchResultsModal").classList.add("hidden");
}

// ================= Рендер библиотеки =================
function renderLibrary() {
  const libraryDiv = document.getElementById("library");
  libraryDiv.innerHTML = "";

  let filteredLibrary = [...library];
  if(currentFilter==='read') filteredLibrary = filteredLibrary.filter(b=>b.read);
  if(currentFilter==='unread') filteredLibrary = filteredLibrary.filter(b=>!b.read);
  if(currentFilter==='favorite') filteredLibrary = filteredLibrary.filter(b=>b.favorite);
  if(currentFilter==='rating') filteredLibrary.sort((a,b)=>b.rating - a.rating);

  filteredLibrary.forEach((book, index)=>{
    const bookDiv = document.createElement("div");
    bookDiv.className = "book";

    // Звёздочки рейтинга
    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";
    for(let i=1; i<=5; i++){
      const star = document.createElement("span");
      star.className = `star ${book.rating>=i?'active':''}`;
      star.textContent = "★";
      star.addEventListener("click", () => setRating(index, i));
      starsDiv.appendChild(star);
    }

    // Кнопки управления
    const readBtn = document.createElement("button");
    readBtn.className = "fancy-btn read";
    readBtn.textContent = book.read ? "Прочитано" : "Не прочитано";
    readBtn.addEventListener("click", () => toggleRead(index));

    const favBtn = document.createElement("button");
    favBtn.className = "fancy-btn add";
    favBtn.textContent = book.favorite ? "❤️ В избранном" : "🤍 В избранное";
    favBtn.addEventListener("click", () => toggleFavorite(index));

    const delBtn = document.createElement("button");
    delBtn.className = "fancy-btn delete";
    delBtn.textContent = "Удалить";
    delBtn.addEventListener("click", () => removeBook(index));

    // Описание с возможностью раскрытия
    const descDiv = document.createElement("div");
    descDiv.className = `desc ${book.isExpanded ? 'expanded' : ''}`;
    descDiv.textContent = book.desc;
    descDiv.addEventListener("click", () => {
      book.isExpanded = !book.isExpanded;
      renderLibrary();
    });

    bookDiv.innerHTML = `
      <img src="${book.image}" alt="${book.title}">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
    `;

    bookDiv.appendChild(descDiv);
    bookDiv.appendChild(starsDiv);
    bookDiv.appendChild(readBtn);
    bookDiv.appendChild(favBtn);
    bookDiv.appendChild(delBtn);

    libraryDiv.appendChild(bookDiv);
  });
}

// ================= Управление книгой =================
function toggleRead(index){ library[index].read=!library[index].read; renderLibrary(); }
function toggleFavorite(index){ library[index].favorite=!library[index].favorite; renderLibrary(); }
function setRating(index,rating){ library[index].rating=rating; renderLibrary(); }
function removeBook(index){ library.splice(index,1); renderLibrary(); }
function setFilter(filter){ currentFilter=filter; renderLibrary(); }