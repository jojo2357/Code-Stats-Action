const fs = require("fs");
const path = require("path");

let REPO_URL = "";
let settings = {"root": "", "exclude": [], "langs": []};
let ALL_STATS = {"total": 0, "blanks": 0, "comments": 0, "code": 0};
let ALL_FILES = [];

let LANG_DATA;

function find_all_files(dir = settings.root) {
    fs.readdirSync(dir).forEach(folder => {
        if (fs.lstatSync(path.join(dir, folder)).isDirectory())
            find_all_files(path.join(dir, folder));
        else if (fs.lstatSync(path.join(dir, folder)).isFile()) {
            ALL_FILES.push(path.join(dir, folder));
        }
    });
}

function read_and_get_the_goods(filename = "") {
    let out = {"total": 0, "blanks": 0, "comments": 0, "code": 0};
    let inBlockComment = false;
    let justStartedABlock;
    const lang = getLang(filename)
    const langConfig = {singleLine: lang.startSingleComment, blockStart: lang.startBlockComment, blockEnd: lang.endBlockComment, ignores: lang.specialIgnores}
    const lines = fs.readFileSync(filename).toString().replace(/\\/g, "/").split('\n');
    lines.forEach((line, windex) => {
        out.total++;
        if (line.trim().length === 0) {
            if (windex === lines.length - 1) {
                out.total--;
                return;
            }
            out.blanks++;
            return;
        }
        if (!inBlockComment && line.includes(langConfig.blockStart) && !lineHasTheSpecial(line, langConfig.ignores)) {
            inBlockComment = justStartedABlock = true;
            if (line.trim().substr(0, langConfig.blockStart.length) !== langConfig.blockStart) {
                out.code++;
                out.comments--;
            }
        }
        if (inBlockComment) {
            out.comments++;
            if (justStartedABlock && langConfig.blockEnd === langConfig.blockStart && line.replace(langConfig.blockStart, "").includes(langConfig.blockStart)) {
                inBlockComment = false;
            }
            if ((langConfig.blockEnd === langConfig.blockStart && !justStartedABlock && line.includes(langConfig.blockEnd)) || (langConfig.blockEnd !== langConfig.blockStart && line.includes(langConfig.blockEnd))) {
                inBlockComment = false;
            }
            justStartedABlock = false;
            return;
        }
        if (line.trim().substr(0, langConfig.singleLine.length) === langConfig.singleLine) {
            out.comments++;
            return;
        }
        out.code++;
    });
    return out;
}

function lineHasTheSpecial(line = "", specials = [""]){
    for (var special in specials)
        if (line.includes(specials[special]))
            return true;
    return false;
}

function clean_settings() {
    settings.root = settings.root.replace(/\\/g, "/");
    if (settings.root === "") {
        settings.root = ".";
    }
    if (settings.root.charAt(settings["root"].length - 1) !== "/") {
        settings.root += "/";
    }
    settings.exclude = settings.exclude.filter(dir => dir !== "");
}


function export_to_file(filename, ALL_DATA, links = {
    totallinelink: "Statistics/LinesDescending.md/",
    totalcodelink: "Statistics/CodeDescending.md/",
    propcodelink: "Statistics/ProportionCodeDescending.md/",
    totalcommentlink: "Statistics/CommentsDescending.md/",
    propcommentlink: "Statistics/ProportionCommentsDescending.md/",
    totalblanklink: "Statistics/BlanksDescending.md/",
    propblanklink: "Statistics/ProportionBlanksDescending.md/",
    namelink: "Statistics/NameAscending.md/"
}) {
    if (!links.totallinelink)
        links.totallinelink = "Statistics/LinesDescending.md/";
    if (!links.totalcodelink)
        links.totalcodelink = "Statistics/CodeDescending.md/";
    if (!links.propcodelink)
        links.propcodelink = "Statistics/ProportionCodeDescending.md/";
    if (!links.totalcommentlink)
        links.totalcommentlink = "Statistics/CommentsDescending.md/";
    if (!links.propcommentlink)
        links.propcommentlink = "Statistics/ProportionCommentsDescending.md/";
    if (!links.totalblanklink)
        links.totalblanklink = "Statistics/BlanksDescending.md/";
    if (!links.propblanklink)
        links.propblanklink = "Statistics/ProportionBlanksDescending.md/";
    if (!links.namelink)
        links.namelink = "Statistics/NameAscending.md/";
    console.log(`Exporting to ${filename}`);
    let out = "";
    out += `\n|[File](${REPO_URL + links.namelink})|[Lines (% total)](${REPO_URL + links.totallinelink})|[Code Lines](${REPO_URL + links.totalcodelink})|[% Code](${REPO_URL + links.propcodelink})|[Comment Lines](${REPO_URL + links.totalcommentlink})|[% Comment](${REPO_URL + links.propcommentlink})|[Blank Lines](${REPO_URL + links.totalblanklink})|[% Blank](${REPO_URL + links.propblanklink})|`;
    out += "\n| --- | --- | --- | --- | --- | --- | --- | --- |";
    ALL_DATA.forEach((goods) => {
        if (goods.goods.total === 0) {
            out += `\n|[${goods.name.split("/")[goods.name.split("/").length - 1]}](${REPO_URL + goods.name.replace(/\\/g, "/")})|0|X|X|X|X|X|X|`;
        } else {
            out += "\n|[" + goods.name.split("/")[goods.name.split("/").length - 1] + "](" + REPO_URL + goods.name.replace(/\\/g, "/") + ")" +
                "|" + goods.goods.total + " (" +
                (100 * goods.goods.total / ALL_STATS.total).toFixed(1) + "%)" +
                "|" + goods.goods.code + "|" +
                (100 * goods.goods.code / goods.goods.total).toFixed(1) + "%" +
                "|" + goods.goods.comments + "|" +
                (100 * goods.goods.comments / goods.goods.total).toFixed(1) + "%" +
                `|${goods.goods.blanks}|` +
                (100 * goods.goods.blanks / goods.goods.total).toFixed(1) + "%|";
        }
    });
    out += "\n|Average " +
        "|" + (ALL_STATS.total / ALL_DATA.length).toFixed(1) +
        "|" + (ALL_STATS.code / ALL_DATA.length).toFixed(1) +
        "|X|" + (ALL_STATS.comments / ALL_DATA.length).toFixed(1) +
        "|X|" + (ALL_STATS.blanks / ALL_DATA.length).toFixed(1) + "|X|";
    out += "\n|Total (" + ALL_DATA.length +
        ")|" + ALL_STATS.total +
        "|" + ALL_STATS.code + "|" + (100 * ALL_STATS.code / ALL_STATS.total).toFixed(1) +
        "%|" + ALL_STATS.comments + "| " + (100 * ALL_STATS.comments / ALL_STATS.total).toFixed(1) +
        "%|" + ALL_STATS.blanks + "|" + (100 * ALL_STATS.blanks / ALL_STATS.total).toFixed(1) +
        "%|";
    fs.writeFileSync(filename, out);
}

function getLang(file) {
    for (const lang in LANG_DATA) {
        if (LANG_DATA[lang].fileExtensions.includes(file.split(".")[file.split(".").length - 1]))
            return LANG_DATA[lang];
    }
    return undefined;
}

function main() {
    //console.log(process.env);

    LANG_DATA = JSON.parse(fs.readFileSync("Filetypes.json").toString()).langs;

    /*logger.debug(os.environ);
    logger.debug(os.environ["INPUT_ROOT_DIR"]);*/

    const test = false;

    if (!test) {
        settings.root = process.env.INPUT_ROOT_DIR;
        settings["langs"] = process.env.INPUT_LANGS.split("|");
        settings["exclude"] = process.env.INPUT_EXCLUDE.split("|");
        REPO_URL = "https://github.com/" + process.env.GITHUB_REPOSITORY + "/tree/" + process.env.GITHUB_REF.split("/")[2] + "/";
    } else {
        settings.root = "src";
        settings.langs = ["javascript"]
        REPO_URL = "some.website.com";
    }

    /*logger.debug(settings);
    logger.debug(data["ref"]);
    logger.debug(data["repository"]["full_name"]);*/

    //logger.debug(REPO_URL);

    clean_settings();
    find_all_files();
    ALL_FILES = ALL_FILES.filter(file =>
        settings.langs.length === 0 ? getLang(file) !== undefined : getLang(file) !== undefined && settings.langs.includes(getLang(file).name)
    );
    ALL_FILES.forEach(filename => console.log(`Found: ${filename}`));
    console.log(`Found ${ALL_FILES.length} files`);
    let ALL_DATA = [];
    ALL_FILES.forEach(fileName => {
        ALL_DATA.push({name: fileName.replace(/\\/g, "/"), goods: read_and_get_the_goods(fileName)});
    });
    let out = "File,Lines (% total),Code Lines,% Code,Comment Lines,% Comment,Blank Lines,% Blank";
    ALL_DATA.forEach(goods => {
        ALL_STATS.total += goods.goods.total;
        ALL_STATS.code += goods.goods.code;
        ALL_STATS.comments += goods.goods.comments;
        ALL_STATS.blanks += goods.goods.blanks;
        if (goods.goods.total === 0) {
            out += "\n" + goods.name.split("/")[goods.name.split("/").length - 1] +
                "," + goods.goods.total + " (" +
                (100 * goods.goods.total / ALL_STATS.total).toFixed(1) + "%)" +
                ",X,X,X,X,X,X";
        } else {
            out += "\n" + goods.name.split("/")[goods.name.split("/").length - 1] +
                "," + goods.goods.total + " (" +
                (100 * goods.goods.total / ALL_STATS.total).toFixed(1) + "%)" +
                "," + goods.goods.code + "," +
                (100 * goods.goods.code / goods.goods.total).toFixed(1) + "%" +
                "," + goods.goods.comments + "," +
                (100 * goods.goods.comments / goods.goods.total).toFixed(1) + "%" +
                "," + goods.goods.blanks + "," +
                (100 * goods.goods.blanks / goods.goods.total).toFixed(1) + "%";
        }
    });
    if (ALL_STATS.total === 0) {
        out += "\nTotal," + ALL_STATS.total + "," + ALL_STATS.code + ",X," + ALL_STATS.comments + ",X," + ALL_STATS.blanks + ",X";
    } else {
        out += "\nTotal," + ALL_STATS.total +
            "," + ALL_STATS.code + "," + (ALL_STATS.code / ALL_STATS.total).toFixed(1) +
            "," + ALL_STATS.comments + "," + (ALL_STATS.comments / ALL_STATS.total).toFixed(1) +
            "," + ALL_STATS.blanks + "," + (ALL_STATS.blanks / ALL_STATS.total).toFixed(1);
    }
    fs.writeFileSync("Statistic.csv", out);

    if (!fs.existsSync("Statistics"))
        fs.mkdirSync("Statistics");

    export_to_file("Statistic.md", ALL_DATA.sort((b, a) => a.goods.total - b.goods.total));
    export_to_file("Statistics/LinesDescending.md", ALL_DATA.sort((b, a) => a.goods.total - b.goods.total), {totallinelink: "Statistics/LinesAscending.md/"});
    export_to_file("Statistics/LinesAscending.md", ALL_DATA.sort((a, b) => a.goods.total - b.goods.total));

    export_to_file("Statistics/CodeDescending.md", ALL_DATA.sort((b, a) => a.goods.code - b.goods.code), {totalcodelink: "Statistics/CodeAscending.md/"});
    export_to_file("Statistics/CodeAscending.md", ALL_DATA.sort((a, b) => a.goods.code - b.goods.code));

    export_to_file("Statistics/BlanksDescending.md", ALL_DATA.sort((b, a) => a.goods.blanks - b.goods.blanks), {totalblanklink: "Statistics/BlanksAscending.md/"});
    export_to_file("Statistics/BlanksAscending.md", ALL_DATA.sort((a, b) => a.goods.blanks - b.goods.blanks));

    export_to_file("Statistics/CommentsDescending.md", ALL_DATA.sort((b, a) => a.goods.comments - b.goods.comments), {totalcommentlink: "Statistics/CommentsAscending.md/"});
    export_to_file("Statistics/CommentsAscending.md", ALL_DATA.sort((a, b) => a.goods.comments - b.goods.comments));

    export_to_file("Statistics/ProportionCodeDescending.md", ALL_DATA.sort((b, a) => (a.goods.total === 0 ? -1 : a.goods.code / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.code / b.goods.total)), {propcodelink: "Statistics/ProportionCodeAscending.md/"});
    export_to_file("Statistics/ProportionCodeAscending.md", ALL_DATA.sort((a, b) => (a.goods.total === 0 ? -1 : a.goods.code / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.code / b.goods.total)));

    export_to_file("Statistics/ProportionBlanksDescending.md", ALL_DATA.sort((b, a) => (a.goods.total === 0 ? -1 : a.goods.blanks / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.blanks / b.goods.total)), {propblanklink: "Statistics/ProportionBlanksAscending.md/"});
    export_to_file("Statistics/ProportionBlanksAscending.md", ALL_DATA.sort((a, b) => (a.goods.total === 0 ? -1 : a.goods.blanks / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.blanks / b.goods.total)));

    export_to_file("Statistics/ProportionCommentsDescending.md", ALL_DATA.sort((b, a) => (a.goods.total === 0 ? -1 : a.goods.comments / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.comments / b.goods.total)), {propcommentlink: "Statistics/ProportionCommentsAscending.md/"});
    export_to_file("Statistics/ProportionCommentsAscending.md", ALL_DATA.sort((a, b) => (a.goods.total === 0 ? -1 : a.goods.comments / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.comments / b.goods.total)));

    export_to_file("Statistics/NameDescending.md", ALL_DATA.sort((b, a) => a.name.split("/")[a.name.split("/").length - 1].localeCompare(b.name.split("/")[b.name.split("/").length - 1])));
    export_to_file("Statistics/NameAscending.md", ALL_DATA.sort((a, b) => a.name.split("/")[a.name.split("/").length - 1].localeCompare(b.name.split("/")[b.name.split("/").length - 1])), {namelink: "Statistics/NameDescending.md/"});

    console.log(ALL_STATS);
    /*print("\nTotal" +
        "," + str(ALL_STATS.total) +
        "," + str(ALL_STATS.code) + "," +
        "," + str(ALL_STATS.comments) + "," +
        "," + str(ALL_STATS.blanks) + ",");*/
}

main();