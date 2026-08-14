// ---------------------------
// LOAD STATE
// ---------------------------
let characters = JSON.parse(localStorage.getItem("characters")) || [];
let showNames = JSON.parse(localStorage.getItem("showNames")) ?? false;
let showHeader = JSON.parse(localStorage.getItem("showHeader")) ?? false;

let selectedCharacter = null;

let savedThemes = JSON.parse(localStorage.getItem("savedThemes")) || {};

let themeSettings = JSON.parse(localStorage.getItem("themeSettings")) || {
  avatarHideFrame: false,
  theme: "default",
  primary: "#111",
  secondary: "#222",
  bubbleLeft: "#222",
  bubbleRight: "#222",
  header: "#222",
  text: "#eee",
  inputbar: "#222",
  send: "#4caf50",
  plus: "#444",
  textBorder: "none",
  backgroundImage: "none",
  bgScale: 1,
  bgOpacity: 1,
  headerOpacity: 1,
  animateBackground: false,
  headerBackgroundImage: "none",
  avatarBorder: "none",
  font: "Arial, sans-serif",
  fontData: null,
  sendIcon: ""
};


// IMAGE CROPPER 

let cropper = null;

function openCropper(file, callback) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = document.getElementById("cropper-image");
    img.src = reader.result;

    document.getElementById("cropper-modal").style.display = "block";

    cropper = new Cropper(img, {
      aspectRatio: NaN,
      viewMode: 1
    });

    document.getElementById("cropper-confirm").onclick = () => {
      const canvas = cropper.getCroppedCanvas();
      const croppedDataURL = canvas.toDataURL("image/png");
      cropper.destroy();
      cropper = null;
      document.getElementById("cropper-modal").style.display = "none";
      callback(croppedDataURL);
    };

    document.getElementById("cropper-cancel").onclick = () => {
      cropper.destroy();
      cropper = null;
      document.getElementById("cropper-modal").style.display = "none";
    };
  };

  reader.readAsDataURL(file);
}


// ---------------------------
// SAVE HELPERS
// ---------------------------
function saveCharacters() {
  localStorage.setItem("characters", JSON.stringify(characters));
}
function saveShowNames() {
  localStorage.setItem("showNames", JSON.stringify(showNames));
}
function saveShowHeader() {
  localStorage.setItem("showHeader", JSON.stringify(showHeader));
}

// ---------------------------
// CHARACTER LIST
// ---------------------------
function refreshCharacterList() {
  const list = document.getElementById("character-list");
  list.innerHTML = "";

  characters.forEach(char => {
    const item = document.createElement("div");
	if (char.flip === undefined) char.flip = false;

    item.className = "character-item " +
      (char.side === "left" ? "left-side" : "right-side");

    if (selectedCharacter === char.name) {
      item.classList.add("character-selected");
    }

    item.innerHTML = `
      <img src="${char.avatar}">
      <span>${char.name}</span>
    `;

    // Leftclick = select character
    item.addEventListener("click", () => {
      selectedCharacter = char.name;
      refreshCharacterList();
      updateHeader();
    });

    // Rightlick = toggle side
    item.addEventListener("contextmenu", e => {
      e.preventDefault();
      char.side = char.side === "left" ? "right" : "left";
      saveCharacters();
      refreshCharacterList();
    });

    list.appendChild(item);
  });
}

refreshCharacterList();


// HEADER UPDATE

function updateHeader() {
  const header = document.getElementById("chat-header");

  if (!showHeader || !selectedCharacter) {
    header.classList.add("hide-header");
    return;
  }

  header.classList.remove("hide-header");

  const char = characters.find(c => c.name === selectedCharacter);
  if (!char) return;

  document.getElementById("header-avatar").src = char.avatar;
  document.getElementById("header-name").textContent = char.name;
}


// NAME LABEL TOGGLE

document.getElementById("toggle-names").checked = showNames;

function updateAllNameLabels() {
  document.querySelectorAll(".name-label").forEach(label => {
    if (showNames) label.classList.remove("hide-name");
    else label.classList.add("hide-name");
  });
}

updateAllNameLabels();

document.getElementById("toggle-names").addEventListener("change", () => {
  showNames = document.getElementById("toggle-names").checked;
  saveShowNames();
  updateAllNameLabels();
});


// HEADER TOGGLE

document.getElementById("toggle-header").checked = showHeader;

document.getElementById("toggle-header").addEventListener("change", () => {
  showHeader = document.getElementById("toggle-header").checked;
  saveShowHeader();
  updateHeader();
});


// ADD CHARACTER

document.getElementById("add-character").onclick = () => {
  const name = document.getElementById("new-char-name").value.trim();
  const side = document.getElementById("new-char-side").value;
  const avatarFile = document.getElementById("new-char-avatar").files[0];

  if (!name || !avatarFile) {
    alert("Please enter a name and choose an avatar.");
    return;
  }

openCropper(avatarFile, (cropped) => {
  characters.push({
    name,
    side,
    avatar: cropped
  });

  saveCharacters();
  refreshCharacterList();

  document.getElementById("new-char-name").value = "";
  document.getElementById("new-char-avatar").value = "";
});

  reader.readAsDataURL(avatarFile);
};


// REMOVE CHARACTER

document.getElementById("remove-character").onclick = () => {
  if (!selectedCharacter) return;

  characters = characters.filter(c => c.name !== selectedCharacter);
  selectedCharacter = null;

  saveCharacters();
  refreshCharacterList();
  updateHeader();
};


// SEND TEXT MESSAGE

function sendMessage() {
  if (!selectedCharacter) return;

  const text = document.getElementById("message-input").value;
  if (!text.trim()) return;

  const char = characters.find(c => c.name === selectedCharacter);

  const msg = document.createElement("div");
  msg.className = `message ${char.side}`;

  msg.innerHTML = `
	<img src="${char.avatar}" class="avatar ${char.flip ? "flip" : ""}">

    <div>
      <div class="name-label ${showNames ? "" : "hide-name"}">${char.name}</div>
      <div class="bubble">${text}</div>
    </div>
  `;

    // guess ill do it this way, ill fix it later maybe add more options?
  msg.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (confirm("Delete this message?")) msg.remove();
  });

  document.getElementById("chat-window").appendChild(msg);
  document.getElementById("message-input").value = "";

  updateScrollIndicator();
}

document.getElementById("add-message").onclick = sendMessage;

document.getElementById("message-input").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});


// IMAGE BUTTON

document.getElementById("image-button").onclick = () => {
  document.getElementById("image-input").click();
};


// SEND IMAGE MESSAGE

document.getElementById("image-input").onchange = () => {
  if (!selectedCharacter) return;

  const file = document.getElementById("image-input").files[0];
  if (!file) return;

  openCropper(file, (cropped) => {
    const char = characters.find(c => c.name === selectedCharacter);

    const msg = document.createElement("div");
    msg.className = `message ${char.side}`;

    msg.innerHTML = `
<img src="${char.avatar}" class="avatar ${char.flip ? "flip" : ""}">

      <div>
        <div class="name-label ${showNames ? "" : "hide-name"}">${char.name}</div>
        <div class="bubble">
          <img src="${cropped}" class="sent-image">
        </div>
      </div>
    `;

    msg.addEventListener("contextmenu", e => {
      e.preventDefault();
      if (confirm("Delete this message?")) msg.remove();
    });

    document.getElementById("chat-window").appendChild(msg);
    updateScrollIndicator();
  });
};



// SCROLL INDICATOR (NOT NEEEDED MAYBE? I DONT KNOW)

function updateScrollIndicator() {
  const chat = document.getElementById("chat-window");
  const indicator = document.getElementById("scroll-indicator");

  indicator.style.opacity = chat.scrollHeight > chat.clientHeight ? 1 : 0;
}

document.getElementById("chat-window").addEventListener("scroll", updateScrollIndicator);


// THEME SYSTEM

const themeSelect = document.getElementById("theme-select");

const primaryPicker = document.getElementById("theme-primary");
const secondaryPicker = document.getElementById("theme-secondary");
const bubbleLeftPicker = document.getElementById("theme-bubble-left");
const bubbleRightPicker = document.getElementById("theme-bubble-right");
const headerPicker = document.getElementById("theme-header");
const textPicker = document.getElementById("theme-text");
const inputbarPicker = document.getElementById("theme-inputbar");
const sendPicker = document.getElementById("theme-send");
const plusPicker = document.getElementById("theme-plus");
const textBorderInput = document.getElementById("theme-text-border");

const bgInput = document.getElementById("theme-bg");
const bgAnimate = document.getElementById("theme-bg-animate");
const bgScaleInput = document.getElementById("theme-bg-scale");

const headerBgInput = document.getElementById("theme-header-bg");
const avatarBorderInput = document.getElementById("theme-avatar-border");
const fontSelect = document.getElementById("theme-font");
const sendIconInput = document.getElementById("theme-send-icon");

const saveNameInput = document.getElementById("theme-save-name");
const saveBtn = document.getElementById("theme-save-btn");
const loadSelect = document.getElementById("theme-load-select");
const deleteBtn = document.getElementById("theme-delete-btn");


// APPLY THEME

function applyTheme() {
  document.documentElement.style.setProperty("--primary-color", themeSettings.primary);
  document.documentElement.style.setProperty("--secondary-color", themeSettings.secondary);
  document.documentElement.style.setProperty("--bubble-color-left", themeSettings.bubbleLeft);
  document.documentElement.style.setProperty("--bubble-color-right", themeSettings.bubbleRight);
  document.documentElement.style.setProperty("--header-color", themeSettings.header);
  document.documentElement.style.setProperty("--text-color", themeSettings.text);
  document.documentElement.style.setProperty("--inputbar-color", themeSettings.inputbar);
  document.documentElement.style.setProperty("--send-button-color", themeSettings.send);
  document.documentElement.style.setProperty("--plus-button-color", themeSettings.plus);
  document.documentElement.style.setProperty("--text-border", themeSettings.textBorder);
  document.documentElement.style.setProperty("--background-image", themeSettings.backgroundImage);
  document.documentElement.style.setProperty("--bg-scale", themeSettings.bgScale);
  document.documentElement.style.setProperty("--header-bg-image", themeSettings.headerBackgroundImage);
  document.documentElement.style.setProperty("--avatar-border", themeSettings.avatarBorder);
  document.documentElement.style.setProperty("--font-family", themeSettings.font);
  document.documentElement.style.setProperty("--bg-opacity", themeSettings.bgOpacity);
  document.documentElement.style.setProperty("--header-opacity", themeSettings.headerOpacity);
  document.documentElement.style.setProperty("--avatar-border-width",themeSettings.avatarHideFrame ? "0px" : "3px");



  themeSelect.value = themeSettings.theme;

  primaryPicker.value = themeSettings.primary;
  secondaryPicker.value = themeSettings.secondary;
  bubbleLeftPicker.value = themeSettings.bubbleLeft;
  bubbleRightPicker.value = themeSettings.bubbleRight;
  headerPicker.value = themeSettings.header;
  textPicker.value = themeSettings.text;
  inputbarPicker.value = themeSettings.inputbar;
  sendPicker.value = themeSettings.send;
  plusPicker.value = themeSettings.plus;
  textBorderInput.value = themeSettings.textBorder;

  bgScaleInput.value = themeSettings.bgScale;
  avatarBorderInput.value = themeSettings.avatarBorder;
  fontSelect.value = themeSettings.font || "Arial, sans-serif";

  document.getElementById("send-icon").src = themeSettings.sendIcon || "";

  const phone = document.getElementById("chat-phone");
  if (themeSettings.animateBackground) {
    phone.classList.add("animate-bg");
  } else {
    phone.classList.remove("animate-bg");
  }
}

applyTheme();


// THEME PRESETS

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  
	if (theme === "ottilie") {
	  themeSettings = {
		...themeSettings,
		theme,
		primary: "#bfc9ac",
		secondary: "#ffefc2",
		bubbleLeft: "#e7fdbf",
		bubbleRight: "#fffff5",
		header: "#9ec25b",
		text: "#171622",
		inputbar: "#82be65",
		send: "#fffff5",
		plus: "#fffff5",
		textBorder: "2px dashed yellowgreen",

		backgroundImage: "url('images/ottilie_symbol.png')",
		bgScale: 0.2,
		bgOpacity: 0.15,
		animateBackground: true,

		headerBackgroundImage: "url('images/wicker.png')",
		headerOpacity: 0.1,

		avatarBorder: "#c7fe62",

		font: "'Fira Code', monospace",

		// Custom font 
		fontData: null,

		sendIcon: "images/green_luck_arrow.png"
	  };
	}
  
	if (theme === "asimov") {
	  themeSettings = {
		...themeSettings,
		theme,
		primary: "#242838",
		secondary: "#303554",
		bubbleLeft: "#324076",
		bubbleRight: "#1d1d3a",
		header: "#4565b0",
		text: "#eae9f1",
		inputbar: "#647fbe",
		send: "#ece6df",
		plus: "#050505",
		textBorder: "1px solid gold",
		backgroundImage: "url('images/asimov_symbol.png')",
		bgScale: 0.2,
		bgOpacity: 0.15,
		animateBackground: true,
		headerBackgroundImage: "url('images/asimov_header2.png')",
		headerOpacity: 0.1,
		avatarBorder: "#e6cb60",
		font: "'Fira Code', monospace",
		fontData: null, 
		sendIcon: "images/asimov_arrow.png"
	  };
	}
	
		if (theme === "felt") {
	  themeSettings = {
		...themeSettings,
		theme,
		primary: "#fecdd7",
		secondary: "#ffc2c2",
		bubbleLeft: "#fe9fb2",
		bubbleRight: "#fee1e1",
		header: "#df6d8f",
		text: "#000614",
		inputbar: "#df6d8f",
		send: "#ffffff",
		plus: "#ffffff",
		textBorder: "1px solid #fff",
		backgroundImage: "url('images/felt_background.png')",
		bgScale: 0.1,
		bgOpacity: 1,
		animateBackground: true,

		headerBackgroundImage: "url('images/white_floral.png')",
		headerOpacity: 0.1,
		avatarBorder: "#e6cb60",

		font: "'MedievalSharp', cursive",
		fontData: null, 
		sendIcon: "images/arrowpin.png"
	  };
	}

  if (theme === "fantasy") {
    themeSettings = {
      ...themeSettings,
      theme,
      primary: "#2b1b00",
      secondary: "#5a3e00",
      bubbleLeft: "#d4b46a",
      bubbleRight: "#c9a55f",
      header: "#5a3e00",
      text: "#fff8e1",
      inputbar: "#5a3e00",
      send: "#d4b46a",
      plus: "#a67c00",
      textBorder: "2px solid #d4b46a",
      backgroundImage: "none",
      bgScale: 1,
      animateBackground: false,
      headerBackgroundImage: "none",
      avatarBorder: "none",
      font: "'Cinzel', serif",
	  sendIcon: "images/black_arrow.png"
    };
  }

  if (theme === "scifi") {
    themeSettings = {
      ...themeSettings,
      theme,
      primary: "#1a0000",
      secondary: "#330000",
      bubbleLeft: "#660000",
      bubbleRight: "#880000",
      header: "#330000",
      text: "#ffdddd",
      inputbar: "#330000",
      send: "#aa0000",
      plus: "#550000",
      textBorder: "1px solid #aa0000",
      backgroundImage: "none",
      bgScale: 1,
      animateBackground: false,
      headerBackgroundImage: "none",
      avatarBorder: "none",
      font: "'Cairo', sans-serif",
	  sendIcon: "images/black_arrow.png"
    };
  }

  if (theme === "default") {
    themeSettings = {
      ...themeSettings,
      theme,
      primary: "#111",
      secondary: "#222",
      bubbleLeft: "#222",
      bubbleRight: "#222",
      header: "#222",
      text: "#eee",
      inputbar: "#222",
      send: "#4caf50",
      plus: "#444",
      textBorder: "none",
      backgroundImage: "none",
      bgScale: 1,
      animateBackground: false,
      headerBackgroundImage: "none",
      avatarBorder: "none",
      font: "Arial, sans-serif",
	  sendIcon: "images/black_arrow.png"
    };
  }

  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});


// CUSTOM COLOR PICKERS

primaryPicker.addEventListener("input", () => {
  themeSettings.primary = primaryPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

secondaryPicker.addEventListener("input", () => {
  themeSettings.secondary = secondaryPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

bubbleLeftPicker.addEventListener("input", () => {
  themeSettings.bubbleLeft = bubbleLeftPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

bubbleRightPicker.addEventListener("input", () => {
  themeSettings.bubbleRight = bubbleRightPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

headerPicker.addEventListener("input", () => {
  themeSettings.header = headerPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

textPicker.addEventListener("input", () => {
  themeSettings.text = textPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

inputbarPicker.addEventListener("input", () => {
  themeSettings.inputbar = inputbarPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

sendPicker.addEventListener("input", () => {
  themeSettings.send = sendPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

plusPicker.addEventListener("input", () => {
  themeSettings.plus = plusPicker.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

textBorderInput.addEventListener("input", () => {
  themeSettings.textBorder = textBorderInput.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});


// BACKGROUND IMAGE

bgInput.addEventListener("change", () => {
  const file = bgInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    themeSettings.backgroundImage = `url(${reader.result})`;
    localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
    applyTheme();
  };
  reader.readAsDataURL(file);
});


// BACKGROUND SCALE

bgScaleInput.addEventListener("input", () => {
  themeSettings.bgScale = bgScaleInput.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

// ANIMATED BACKGROUND TOGGLE

bgAnimate.addEventListener("change", () => {
  themeSettings.animateBackground = bgAnimate.checked;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});


// HEADER BACKGROUND IMAGE

headerBgInput.addEventListener("change", () => {
  const file = headerBgInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    themeSettings.headerBackgroundImage = `url(${reader.result})`;
    localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
    applyTheme();
  };
  reader.readAsDataURL(file);
});


// AVATAR BORDER

avatarBorderInput.addEventListener("input", () => {
  themeSettings.avatarBorder = avatarBorderInput.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});


// FONT SELECTOR

fontSelect.addEventListener("change", () => {
  themeSettings.font = fontSelect.value;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});


// CUSTOM SEND ICON

sendIconInput.addEventListener("change", () => {
  const file = sendIconInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    themeSettings.sendIcon = reader.result;
    localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
    applyTheme();
  };
  reader.readAsDataURL(file);
});


// SAVED THEMES

function refreshSavedThemes() {
  loadSelect.innerHTML = `<option value="">Load Theme...</option>`;
  Object.keys(savedThemes).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    loadSelect.appendChild(opt);
  });
}

refreshSavedThemes();

saveBtn.addEventListener("click", () => {
  const name = saveNameInput.value.trim();
  if (!name) return alert("Enter a theme name.");

  savedThemes[name] = { ...themeSettings };
  localStorage.setItem("savedThemes", JSON.stringify(savedThemes));
  refreshSavedThemes();
  alert("Theme saved!");
});
loadSelect.addEventListener("change", () => {
  const name = loadSelect.value;
  if (!name) return;

  themeSettings = { ...savedThemes[name] };
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));

  if (themeSettings.fontData && themeSettings.font) {
    const style = document.createElement("style");
    style.innerHTML = `
      @font-face {
        font-family: '${themeSettings.font}';
        src: url('${themeSettings.fontData}');
      }
    `;
    document.head.appendChild(style);
  }

  applyTheme();
});


deleteBtn.addEventListener("click", () => {
  const name = loadSelect.value;
  if (!name) return alert("Select a theme to delete.");

  delete savedThemes[name];
  localStorage.setItem("savedThemes", JSON.stringify(savedThemes));
  refreshSavedThemes();
  alert("Theme deleted.");
});



const customFontInput = document.getElementById("theme-font-custom");
customFontInput.addEventListener("change", () => {
  const file = customFontInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const fontData = reader.result;
    const fontName = "customFont_" + Date.now();

    // Inject CSS @font-face (this took way too long..)
    const style = document.createElement("style");
    style.innerHTML = `
      @font-face {
        font-family: '${fontName}';
        src: url('${fontData}');
      }
    `;
    document.head.appendChild(style);

    // shouuuuuuuuuuuuld save font name and data in themeee i hope please god work im tired im hungry
    themeSettings.font = fontName;
    themeSettings.fontData = fontData;

    localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
    applyTheme();
  };

  reader.readAsDataURL(file);
});


const bgOpacityInput = document.getElementById("theme-bg-opacity");
const headerOpacityInput = document.getElementById("theme-header-opacity");

bgOpacityInput.addEventListener("input", () => {
  themeSettings.bgOpacity = Number(bgOpacityInput.value);
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

headerOpacityInput.addEventListener("input", () => {
  themeSettings.headerOpacity = Number(headerOpacityInput.value);
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

const avatarHideFrameInput = document.getElementById("toggle-avatar-frame");

avatarHideFrameInput.addEventListener("change", () => {
  themeSettings.avatarHideFrame = avatarHideFrameInput.checked;
  localStorage.setItem("themeSettings", JSON.stringify(themeSettings));
  applyTheme();
});

// AVATAR TOGGLE FLIP
document.getElementById("toggle-flip-avatar").addEventListener("change", () => {
  const flip = document.getElementById("toggle-flip-avatar").checked;
  const selected = selectedCharacter;
  if (!selected) return;

  const char = characters.find(c => c.name === selected);
  char.flip = flip;

  saveCharacters();
  refreshCharacterList();
  updateHeader();
});



// EXPORT CHAT

document.getElementById("export-chat").addEventListener("click", () => {
  const chatPhone = document.getElementById("chat-phone");

  const targetWidth = 1440;
  const targetHeight = 2960;

  const originalWidth = chatPhone.offsetWidth;
  const originalHeight = chatPhone.offsetHeight;

  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  const scale = Math.min(scaleX, scaleY);

  html2canvas(chatPhone, {
    backgroundColor: null,
    useCORS: true,
    scale: scale,
    width: originalWidth,
    height: originalHeight
  }).then(canvas => {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;

    const ctx = finalCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    const link = document.createElement("a");
    link.download = "chat.png";
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
  });
});

// ---------------------------
updateHeader();
updateScrollIndicator();