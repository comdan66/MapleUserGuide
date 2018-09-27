const path = require('path');
const mapDir = require('node-map-directory');
const showdown  = require('showdown');
const converter = new showdown.Converter({omitExtraWLInCodeBlocks: true, parseImgDimensions: true, simpleLineBreaks: false, tasklists: true, noHeaderId: true, openLinksInNewWindow: true, emoji: true});
const fs = require('fs');
const mkdirp = require('mkdirp');
const transliterate = require('transliteration');
const rimraf = require('rimraf');
const cc = require("cli-color");
const clear = require('clear');
const lr = require('carriage-return');
const _ = require('underscore');

function writeFile(dist, contents, cb) {
  mkdirp(path.dirname(dist), function (err) {
      if (err) {
        console.log("\n " + cc.bgRed("【發生錯誤】") + "\n" + cc.red('    ➤ ') + '新增目錄錯誤！' + "\n" + cc.red('    ➤ ') + "錯誤原因：" + cc.whiteBright(err) + "\n");
        process.exit(1);
      }

    fs.writeFile(dist, contents, cb);
  });
}

function cover2Dist(src, dist, template) {
  fs.readFile(src, 'utf8', function(err, data) {
    if (err) {
      console.log("\n " + cc.bgRed("【發生錯誤】") + "\n" + cc.red('    ➤ ') + '讀取檔案錯誤！' + "\n" + cc.red('    ➤ ') + "錯誤原因：" + cc.whiteBright(err) + "\n");
      process.exit(1);
    }

    var html = converter.makeHtml(data);
    html = _.template(template)({content: html});

    writeFile(dist, html, function(err) {
      if (err) {
        console.log("\n " + cc.bgRed("【發生錯誤】") + "\n" + cc.red('    ➤ ') + '寫入檔案錯誤！' + "\n" + cc.red('    ➤ ') + "錯誤原因：" + cc.whiteBright(err) + "\n");
        process.exit(1);
      }
    });
  });
}

function distName(str, prefix, suffix, files) {
  str = transliterate.slugify(str.replace(/^\d+-(.+)/, '$1'), {unknown: '', lowercase: false, separator: ''});
  i = 0;

  for (var key in files)
    if (files[key] === prefix + (str + (i ? i : '')) + suffix)
      ++i;

  return prefix + (str + (i ? i : '')) + suffix;
}

function rec(dirs) {
  var tmp   = {};
  var files = {};
  var menus = [];
  var href  = '';

  for (var i = 0; i < dirs.length; i++) {
    if (dirs[i].type == 'file' && dirs[i].extension == '.md' && dirs[i].name !== '') {
      href = distName(dirs[i].name, '', '.html', files);
      menus.push({ text: distName(dirs[i].name, '', ''), href: href });
      files[dirs[i].name + dirs[i].extension] = href;
    } else if (dirs[i].type == 'dir' && dirs[i].children.length > 0 && dirs[i].name !== '') {
      var kids = [];
      
      for (var j = 0; j < dirs[i].children.length; j++) {
        if (dirs[i].children[j].type == 'file' && dirs[i].children[j].extension == '.md' && dirs[i].children[j].name !== '') {

          href = distName(dirs[i].children[j].name, distName(dirs[i].name, '', '', files) + '-', '.html', files);
          kids.push({ text: distName(dirs[i].children[j].name, '', ''), href: href });
          files[dirs[i].name + '/' + dirs[i].children[j].name + dirs[i].children[j].extension] = href;
        }
      }

      menus.push({ text: distName(dirs[i].name, '', ''), kids: kids });
    }
  }

  return {
    menus: menus,
    files: files
  };
}

function main(dist, template, markdown) {
  clear();

  lr.print("\n");
  lr.print(cc.redBright(' 【編譯 HTML】') + "\n");
  lr.print(cc.cyanBright('    ➤ ') + '注意喔，過程中請勿隨意結束！' + "\n");
  lr.print(cc.cyanBright('    ➤ ') + '坐好囉，我們即將開始幫您編譯！' + "\n");

  lr.print("\n");
  lr.print(cc.yellow(' 【檔案處理】') + "\n");

  var title = cc.cyanBright('    ➤ ') + '刪除 Dist 目錄';
  lr.print(title + cc.blackBright("… "));

  rimraf(path.resolve(__dirname, dist), function () {
    lr.print(title + cc.blackBright(' - ') + cc.green('完成') + "\n");

    title = cc.cyanBright('    ➤ ') + '讀取 Template 檔案';
    lr.print(title + cc.blackBright("… "));

    fs.readFile(path.resolve(__dirname, template + '/index.html'), 'utf8', function(err, template) {
      if (err) {
        console.log("\n " + cc.bgRed("【發生錯誤】") + "\n" + cc.red('    ➤ ') + '讀取檔案錯誤！' + "\n" + cc.red('    ➤ ') + "錯誤原因：" + cc.whiteBright(err) + "\n");
        process.exit(1);
      }
      lr.print(title + cc.blackBright(' - ') + cc.green('完成') + "\n");


      title = cc.cyanBright('    ➤ ') + '讀取 Markdown 檔案';
      lr.print(title + cc.blackBright("… "));
      mapDir(path.resolve(__dirname, 'mds')).then(function(data) {
        lr.print(title + cc.blackBright(' - ') + cc.green('完成') + "\n");

        title = cc.cyanBright('    ➤ ') + '整理相對應路徑';
        lr.print(title + cc.blackBright("… "));
        data = rec(data);
        lr.print(title + cc.blackBright(' - ') + cc.green('完成') + "\n");

        title = cc.cyanBright('    ➤ ') + '寫入 HTML 檔案';
        lr.print(title + cc.blackBright("… "));
        for(var p in data.files)
          cover2Dist(path.resolve(__dirname, 'mds/' + p), path.resolve(__dirname, dist + '/' + data.files[p]), template);
        lr.print(title + cc.blackBright(' - ') + cc.green('完成') + "\n");

        lr.print("\n");
        lr.print(cc.redBright(' 【編譯完成】') + "\n");
        lr.print(cc.cyanBright('    ➤ ') + '已經編譯成功囉！' + "\n");
        lr.print(cc.cyanBright('    ➤ ') + '趕緊去看看吧！');
        console.log("\n");
        
      });
    });

  });
}

// main();
// console.error(path.resolve(__dirname, '../'));
// console.error(path.resolve(__dirname, '../ass//sad'));

