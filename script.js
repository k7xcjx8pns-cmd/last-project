let library = [];
let currentFilter = 'all';

let booksPerLoad = 3;
let loadedBooks = 0;
let filteredLibrary = [];

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

      btn.dataset.title = title;
      btn.dataset.authors = authors;
      btn.dataset.image = imageUrl;
      btn.dataset.desc = description;

      btn.addEventListener("click", () => {
        library.push({
          key: item.id,
          title: btn.dataset.title,
          author: btn.dataset.authors,
          desc: btn.dataset.desc,
          image: btn.dataset.image,
          read: false,
          favorite: false,
          rating: 0,
          isExpanded: false
        });
        renderLibrary(true);
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

// ================= Рендер библиотеки с ленивой подгрузкой =================
function renderLibrary(reset=false) {
  const libraryDiv = document.getElementById("library");
  
  if(reset) loadedBooks = 0; // сброс при фильтре или добавлении

  // фильтрация
  filteredLibrary = [...library];
  if(currentFilter==='read') filteredLibrary = filteredLibrary.filter(b=>b.read);
  if(currentFilter==='unread') filteredLibrary = filteredLibrary.filter(b=>!b.read);
  if(currentFilter==='favorite') filteredLibrary = filteredLibrary.filter(b=>b.favorite);
  if(currentFilter==='rating') filteredLibrary.sort((a,b)=>b.rating - a.rating);

  // очистка контейнера и индикатор загрузки
  if(reset) libraryDiv.innerHTML = "";

  loadNextBatch();
}

function loadNextBatch() {
  const libraryDiv = document.getElementById("library");
  const loader = document.querySelector(".loader") || createLoader();
  loader.style.display = "block";

  setTimeout(() => {
    const nextBooks = filteredLibrary.slice(loadedBooks, loadedBooks + booksPerLoad);
    nextBooks.forEach((book,index)=>{
      const bookDiv = document.createElement("div");
      bookDiv.className = "book";

      // Звёздочки рейтинга
      const starsDiv = document.createElement("div");
      starsDiv.className = "stars";
      for(let i=1; i<=5; i++){
        const star = document.createElement("span");
        star.className = star ${book.rating>=i?'active':''};
        star.textContent = "★";
        star.addEventListener("click", () => {
          book.rating=i;
          renderLibrary(true);
        });
        starsDiv.appendChild(star);
      }

      // Кнопки управления
      const readBtn = document.
createElement("button");
      readBtn.className = "fancy-btn read";
      readBtn.textContent = book.read ? "Прочитано" : "Не прочитано";
      readBtn.addEventListener("click", () => { book.read=!book.read; renderLibrary(true); });

      const favBtn = document.createElement("button");
      favBtn.className = "fancy-btn add";
      favBtn.textContent = book.favorite ? "❤️ В избранном" : "🤍 В избранное";
      favBtn.addEventListener("click", () => { book.favorite=!book.favorite; renderLibrary(true); });

      const delBtn = document.createElement("button");
      delBtn.className = "fancy-btn delete";
      delBtn.textContent = "Удалить";
      delBtn.addEventListener("click", () => {
        const idx = library.indexOf(book);
        if(idx>=0) library.splice(idx,1);
        renderLibrary(true);
      });

      // Описание книги
      const descDiv = document.createElement("div");
      descDiv.className = desc ${book.isExpanded ? 'expanded' : ''};
      descDiv.textContent = book.desc;
      descDiv.addEventListener("click", () => { book.isExpanded=!book.isExpanded; renderLibrary(true); });

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

    loadedBooks += booksPerLoad;
    loader.style.display = "none";
  }, 300);
}

function createLoader() {
  const loader = document.createElement("div");
  loader.className = "loader";
  loader.textContent = "Загрузка...";
  document.getElementById("library").parentNode.insertBefore(loader, document.getElementById("library").nextSibling);
  return loader;
}

// ================= Фильтры =================
function setFilter(filter){ currentFilter=filter; renderLibrary(true); }

// ================= Модалка =================
function closeModal(){ document.getElementById("searchResultsModal").classList.add("hidden"); }

// ================= Ленивый скролл =================
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
    if(loadedBooks < filteredLibrary.length) loadNextBatch();
  }
});

// ================= Инициализация =================
renderLibrary(true);
