import path from 'path';
import express from 'express';
import bodyParser from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { rimraf, rimrafSync, native, nativeSync } from 'rimraf'

const app = express();
const __dirname = path.resolve();
const PATH_STATIC = path.join(__dirname, 'public');
const UPLOAD_PATH = path.join(__dirname, 'uploads');
const PORT = 3000;


let settings = {
  "rootPassword": "qwerty"
}

app.use("/tours", express.static(UPLOAD_PATH))
app.use("/tour/create/as/root/", express.static(PATH_STATIC));
app.use("/", express.static(PATH_STATIC));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: UPLOAD_PATH,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage }).fields([
  { name: 'zipFile', maxCount: 1 },
  { name: 'jsonFile', maxCount: 1 }
]);

var dir = UPLOAD_PATH;
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

app.get('/tour/create/as/root/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tour.html'));
});

app.get('/', (req, res) => {
  fs.readdir(UPLOAD_PATH, (err, files) => {
    if (err) {
      console.error('Ошибка чтения каталога', err);
      return res.status(500).send('Ошибка чтения папки');
    }

    const slides = files.map((file, index) => `
      <div class="slides fade">
        <object width="100%" height="500" data="/tours/${file}"></object>
        <a href="/tours/${file}"><div class="text">Помещение ${index + 1}</div></a>
      </div>`
    ).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Verdana, sans-serif; 
      margin: 0;
      background-color: white;
    }

    .slides {
      display: none;
    }

    img {
      vertical-align: middle;
      width: 300px;
    }

    .slideshow-container {
      max-width: 1000px;
      position: relative;
      margin: auto;
      border-radius: 10px;
    }

    .prev, .next {
      cursor: pointer;
      position: absolute;
      top: 50%;
      width: auto;
      padding: 16px;
      margin-top: -22px;
      color: white;
      font-weight: bold;
      font-size: 18px;
      transition: 0.6s ease;
      border-radius: 0 3px 3px 0;
      user-select: none;
    }

    .next {
      right: 0;
      border-radius: 3px 0 0 3px;
    }

    .prev:hover, .next:hover {
      background-color: rgba(0,0,0,0.8);
    }

    .text {
      color: #f2f2f2;
      font-size: 15px;
      padding: 8px 12px;
      position: absolute;
      bottom: 8px;
      width: 100%;
      text-align: center;
      font-size: 30px;
    }

    .numbertext {
      color: #f2f2f2;
      font-size: 12px;
      padding: 8px 12px;
      position: absolute;
      top: 0;
    }

    .dot {
      cursor: pointer;
      height: 15px;
      width: 15px;
      margin: 0 2px;
      background-color: #bbb;
      border-radius: 50%;
      display: inline-block;
      transition: background-color 0.6s ease;
    }

    .active, .dot:hover {
      background-color: #717171;
    }

    .fade {
      animation-name: fade;
      animation-duration: 1.5s;
    }

    @keyframes fade {
      from {opacity: .4} 
      to {opacity: 1}
    }

    @media only screen and (max-width: 300px) {
      .prev, .next,.text {
        font-size: 11px;
      }
    }
  </style>
    </head>
    <body>
    <p style="text-align: center;"><img src='./img/cord.jpg' style="width: 200px"></p>

      <div class="slideshow-container">
        ${slides}
        <a class="prev" onclick="plusSlides(-1)">❮</a>
        <a class="next" onclick="plusSlides(1)">❯</a>
      </div>
      <div style="text-align:center">
        ${files.map((_, index) => `<span class="dot" onclick="currentSlide(${index + 1})"></span>`).join('')}
      </div>

      <script>

      let slideIndex = 1;
      showSlides(slideIndex);
  
      function plusSlides(n) {
        showSlides(slideIndex += n);
      }
  
      function currentSlide(n) {
        showSlides(slideIndex = n);
      }
  
      function showSlides(n) {
        let i;
        let slides = document.getElementsByClassName("slides");
        let dots = document.getElementsByClassName("dot");
        if (n > slides.length) {slideIndex = 1}    
        if (n < 1) {slideIndex = slides.length}
        for (i = 0; i < slides.length; i++) {
          slides[i].style.display = "none";  
        }
        for (i = 0; i < dots.length; i++) {
          dots[i].className = dots[i].className.replace(" active", "");
        }
        slides[slideIndex-1].style.display = "block";  
        dots[slideIndex-1].className += " active";
      }
  

    </script>
      
      </body>
      </html>`;

    res.send(html);

  });
})

app.get('/tour/create/as/root/admin/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adminpanel.html'));
});

const storedPassword = 'qwerty';

app.post('/api/checkpassword', (req, res) => {
  const { password } = req.body;

  if (password === storedPassword) {
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

app.get('/api', (req, res) => {
  fs.readdir(UPLOAD_PATH, (err, files) => {
    var projNum = files.length;
    var projectNames = [];
    for (let i = 0; i < files.length; i++) {
      projectNames.push(files[i]);
    }
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify({
      'projectsNumber': projNum,
      'projectNames': projectNames
    }));
  });
});

app.post('/api/delete', (req, res) => {
  let data = req.body;
  let prjnm = data.projectName;
  let pswrd = data.password;
  if (pswrd != settings.rootPassword) {
    res.sendStatus(403);
  } else {
    rimraf(path.join(UPLOAD_PATH, prjnm))
    res.sendStatus(200);
  }
})

app.post('/upload', (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }

    const uploadedZip = req.files['zipFile'][0];

    const folderPath = path.join(UPLOAD_PATH, uploadedZip.originalname.split(".zip")[0]);

    fs.mkdirSync(folderPath, { recursive: true });

    fs.renameSync(uploadedZip.path, path.join(folderPath, uploadedZip.originalname));

    const zip = new AdmZip(path.join(folderPath, uploadedZip.originalname));
    zip.extractAllTo(folderPath, true);

    const sourceDir = path.join(folderPath, 'app-files');
    const targetDir = folderPath;

    fs.readdir(sourceDir, (err, files) => {
      if (err) {
        console.error('Ошибка чтения каталога', err);
        return;
      }

      files.forEach(file => {
        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);

        fs.rename(sourceFile, targetFile, _ => { });
      });
    });

    res.status(200).send('Файлы успешно загружены на сервер.');
  });
});

app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}\nhttp://localhost:${PORT}\n`);
}).on('error', (error) => {
  console.error(`Error starting server: ${error}`);
});
