const fs = require("fs");
const path = require("path");

let REPO_URL = "";
let settings = {root: "", exclude: [], langs: [], seperateLangs: false};
let ALL_STATS = {"total": {total: 0, blanks: 0, comments: 0, code: 0, count: 0}};//{total: 0, blanks: 0, comments: 0, code: 0};
let ALL_FILES = [];
let referencedLangs;

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
    const lang = getLang(filename);
    const langConfig = {
        singleLine: lang.startSingleComment,
        blockStart: lang.startBlockComment,
        blockEnd: lang.endBlockComment,
        ignores: lang.specialIgnores
    };
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
        if (!inBlockComment && langConfig.blockStart && line.includes(langConfig.blockStart) && !lineHasTheSpecial(line, langConfig.ignores)) {
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
        for (var comment in langConfig.singleLine) {
            if (line.trim().substr(0, langConfig.singleLine[comment].length) === comment) {
                out.comments++;
                return;
            }
        }
        out.code++;
    });
    return out;
}

function lineHasTheSpecial(line = "", specials = [""]) {
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
    if (settings.root.charAt(settings.root.length - 1) !== "/") {
        settings.root += "/";
    }
    settings.exclude = settings.exclude.filter(dir => dir !== "");
    settings.langs = settings.langs.filter(dir => dir !== "");
}

function export_to_file(filename, ALL_DATA, lang, links = {
    totallinelink: `Statistics/${lang}/LinesDescending.md/`,
    totalcodelink: `Statistics/${lang}/CodeDescending.md/`,
    propcodelink: `Statistics/${lang}/ProportionCodeDescending.md/`,
    totalcommentlink: `Statistics/${lang}/CommentsDescending.md/`,
    propcommentlink: `Statistics/${lang}/ProportionCommentsDescending.md/`,
    totalblanklink: `Statistics/${lang}/BlanksDescending.md/`,
    propblanklink: `Statistics/${lang}/ProportionBlanksDescending.md/`,
    namelink: `Statistics/${lang}/NameAscending.md/`
}) {
    if (!links.totallinelink)
        links.totallinelink = `Statistics/${lang}/LinesDescending.md/`;
    if (!links.totalcodelink)
        links.totalcodelink = `Statistics/${lang}/CodeDescending.md/`;
    if (!links.propcodelink)
        links.propcodelink = `Statistics/${lang}/ProportionCodeDescending.md/`;
    if (!links.totalcommentlink)
        links.totalcommentlink = `Statistics/${lang}/CommentsDescending.md/`;
    if (!links.propcommentlink)
        links.propcommentlink = `Statistics/${lang}/ProportionCommentsDescending.md/`;
    if (!links.totalblanklink)
        links.totalblanklink = `Statistics/${lang}/BlanksDescending.md/`;
    if (!links.propblanklink)
        links.propblanklink = `Statistics/${lang}/ProportionBlanksDescending.md/`;
    if (!links.namelink)
        links.namelink = `Statistics/${lang}/NameAscending.md/`;
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
                (100 * goods.goods.total / ALL_STATS[lang].total).toFixed(1) + "%)" +
                "|" + goods.goods.code + "|" +
                (100 * goods.goods.code / goods.goods.total).toFixed(1) + "%" +
                "|" + goods.goods.comments + "|" +
                (100 * goods.goods.comments / goods.goods.total).toFixed(1) + "%" +
                `|${goods.goods.blanks}|` +
                (100 * goods.goods.blanks / goods.goods.total).toFixed(1) + "%|";
        }
    });
    out += "\n|Average " +
        "|" + (ALL_STATS[lang].total / ALL_DATA.length).toFixed(1) +
        "|" + (ALL_STATS[lang].code / ALL_DATA.length).toFixed(1) +
        "|X|" + (ALL_STATS[lang].comments / ALL_DATA.length).toFixed(1) +
        "|X|" + (ALL_STATS[lang].blanks / ALL_DATA.length).toFixed(1) + "|X|";
    out += "\n|Total (" + ALL_DATA.length +
        ")|" + ALL_STATS[lang].total +
        "|" + ALL_STATS[lang].code + "|" + (100 * ALL_STATS[lang].code / ALL_STATS[lang].total).toFixed(1) +
        "%|" + ALL_STATS[lang].comments + "| " + (100 * ALL_STATS[lang].comments / ALL_STATS[lang].total).toFixed(1) +
        "%|" + ALL_STATS[lang].blanks + "|" + (100 * ALL_STATS[lang].blanks / ALL_STATS[lang].total).toFixed(1) +
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

function export_overview(filename) {
    let out = "|Lang (# files)|Lines (% total)|Code Lines|% Code|Comment Lines|% Comments|Blank Lines|% Blank|";
    out += "\n| --- | --- | --- | --- | --- | --- | --- | --- |";
    let thing = [];
    referencedLangs.forEach(lang => lang !== "total" && thing.push({name: lang, stats: ALL_STATS[lang]}));
    thing = thing.sort((a, b) => b.stats.total - a.stats.total);
    thing.forEach(item => {
        if (item.name !== "plaintext") {
            out += `\n|[${item.name}](${REPO_URL}Statistics/${item.name}/LinesDescending.md) (${item.stats.count})|${item.stats.total} (${(100 * item.stats.total / ALL_STATS.total.total).toFixed(1)}%)|${item.stats.code}|${(100 * item.stats.code / item.stats.total).toFixed(1)}%|${item.stats.comments}|${(100 * item.stats.comments / item.stats.total).toFixed(1)}%|${item.stats.blanks}|${(100 * item.stats.blanks / item.stats.total).toFixed(1)}%|`;
        } else {
            out += `\n|[${item.name}](${REPO_URL}Statistics/${item.name}/LinesDescending.md) (${item.stats.count})|${item.stats.total} (${(100 * item.stats.total / ALL_STATS.total.total).toFixed(1)}%)|${item.stats.code}|${(100 * item.stats.code / item.stats.total).toFixed(1)}%|X|X|${item.stats.blanks}|${(100 * item.stats.blanks / item.stats.total).toFixed(1)}%|`;
        }
    });
    fs.writeFileSync(filename, out);
}

function main() {
    //console.log(process.env);

    LANG_DATA = {
        "langs": [
            {
                "name": "plaintext",
                "fileExtensions": [
                    "txt"
                ]
            },
            {
                "name": "batch",
                "startSingleComment": ["rem", "::", "@rem"],
                "fileExtensions": [
                    "bat"
                ]
            },
            {
                "name": "java",
                "startSingleComment": ["//"],
                "startBlockComment": "/*",
                "endBlockComment": "*/",
                "specialIgnores": ["//*"],
                "fileExtensions": [
                    "java"
                ]
            },
            {
                "name": "python",
                "startSingleComment": ["#"],
                "startBlockComment": "\"\"\"",
                "endBlockComment": "\"\"\"",
                "specialIgnores": [],
                "fileExtensions": [
                    "py"
                ]
            },
            {
                "name": "javascript",
                "startSingleComment": ["//"],
                "startBlockComment": "/*",
                "endBlockComment": "*/",
                "specialIgnores": ["//*"],
                "fileExtensions": [
                    "js"
                ]
            }
        ]
    }.langs;

    /*logger.debug(os.environ);
    logger.debug(os.environ["INPUT_ROOT_DIR"]);*/

    const test = false;

    if (!test) {
        settings.root = process.env.INPUT_ROOT_DIR;
        settings.langs = process.env.INPUT_LANGS.split("|");
        settings.exclude = process.env.INPUT_EXCLUDE.split("|");
        REPO_URL = "https://github.com/" + process.env.GITHUB_REPOSITORY + "/tree/" + process.env.GITHUB_REF.split("/")[2] + "/";
    } else {
        settings.root = "src";
        settings.langs = [];//["javascript", "python", "java", "plaintext", "batch"];
        REPO_URL = "some.website.com";
    }

    clean_settings();
    find_all_files();
    console.log(settings);
    console.log(`Found ${ALL_FILES.length} prefilter`);
    ALL_FILES = ALL_FILES.filter(file =>
        settings.langs.length === 0 ? getLang(file) !== undefined : getLang(file) !== undefined && settings.langs.includes(getLang(file).name)
    );
    referencedLangs = ["total"];
    ALL_FILES.forEach(file => {
        if (!referencedLangs.includes(getLang(file).name))
            referencedLangs.push(getLang(file).name);
    });
    ALL_FILES.forEach(filename => console.log(`Found: ${filename}`));
    console.log(`Found ${ALL_FILES.length} files`);
    let ALL_DATA = [];
    ALL_FILES.forEach(fileName => {
        ALL_DATA.push({name: fileName.replace(/\\/g, "/"), goods: read_and_get_the_goods(fileName)});
    });
    let out = "File,Lines (% total),Code Lines,% Code,Comment Lines,% Comment,Blank Lines,% Blank";
    ALL_DATA.forEach(goods => {
        ALL_STATS["total"].total += goods.goods.total;
        ALL_STATS["total"].code += goods.goods.code;
        ALL_STATS["total"].comments += goods.goods.comments;
        ALL_STATS["total"].blanks += goods.goods.blanks;
        ALL_STATS["total"].count++;
        const langName = getLang(goods.name).name;
        if (!ALL_STATS[langName]) {
            ALL_STATS[langName] = {total: 0, blanks: 0, comments: 0, code: 0, count: 0};
        }
        ALL_STATS[langName].total += goods.goods.total;
        ALL_STATS[langName].code += goods.goods.code;
        ALL_STATS[langName].comments += goods.goods.comments;
        ALL_STATS[langName].blanks += goods.goods.blanks;
        ALL_STATS[langName].count++;
        if (goods.goods.total === 0) {
            out += "\n" + goods.name.split("/")[goods.name.split("/").length - 1] +
                "," + goods.goods.total + " (" +
                (100 * goods.goods.total / ALL_STATS.total.total).toFixed(1) + "%)" +
                ",X,X,X,X,X,X";
        } else {
            out += "\n" + goods.name.split("/")[goods.name.split("/").length - 1] +
                "," + goods.goods.total + " (" +
                (100 * goods.goods.total / ALL_STATS.total.total).toFixed(1) + "%)" +
                "," + goods.goods.code + "," +
                (100 * goods.goods.code / goods.goods.total).toFixed(1) + "%" +
                "," + goods.goods.comments + "," +
                (100 * goods.goods.comments / goods.goods.total).toFixed(1) + "%" +
                "," + goods.goods.blanks + "," +
                (100 * goods.goods.blanks / goods.goods.total).toFixed(1) + "%";
        }
    });
    if (ALL_STATS.total.total === 0) {
        out += "\nTotal," + ALL_STATS.total.total + "," + ALL_STATS.total.code + ",X," + ALL_STATS.total.comments + ",X," + ALL_STATS.total.blanks + ",X";
    } else {
        out += "\nTotal," + ALL_STATS.total.total +
            "," + ALL_STATS.total.code + "," + (ALL_STATS.total.code / ALL_STATS.total.total).toFixed(1) +
            "," + ALL_STATS.total.comments + "," + (ALL_STATS.total.comments / ALL_STATS.total.total).toFixed(1) +
            "," + ALL_STATS.total.blanks + "," + (ALL_STATS.total.blanks / ALL_STATS.total.total).toFixed(1);
    }
    fs.writeFileSync("Statistic.csv", out);

    if (!fs.existsSync("Statistics"))
        fs.mkdirSync("Statistics");

    export_overview("Statistic.md");
    referencedLangs.forEach(lang => {
        if (!fs.existsSync(`Statistics/${lang}`))
            fs.mkdirSync(`Statistics/${lang}`);
        export_to_file(`Statistics/${lang}/LinesDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => a.goods.total - b.goods.total), lang, {totallinelink: `Statistics/${lang}/LinesAscending.md/`});
        export_to_file(`Statistics/${lang}/LinesAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => a.goods.total - b.goods.total), lang);

        export_to_file(`Statistics/${lang}/CodeDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => a.goods.code - b.goods.code), lang, {totalcodelink: `Statistics/${lang}/CodeAscending.md/`});
        export_to_file(`Statistics/${lang}/CodeAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => a.goods.code - b.goods.code), lang);

        export_to_file(`Statistics/${lang}/BlanksDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => a.goods.blanks - b.goods.blanks), lang, {totalblanklink: `Statistics/${lang}/BlanksAscending.md/`});
        export_to_file(`Statistics/${lang}/BlanksAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => a.goods.blanks - b.goods.blanks), lang);

        export_to_file(`Statistics/${lang}/CommentsDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => a.goods.comments - b.goods.comments), lang, {totalcommentlink: `Statistics/${lang}/CommentsAscending.md/`});
        export_to_file(`Statistics/${lang}/CommentsAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => a.goods.comments - b.goods.comments), lang);

        export_to_file(`Statistics/${lang}/ProportionCodeDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => (a.goods.total === 0 ? -1 : a.goods.code / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.code / b.goods.total)), lang, {propcodelink: `Statistics/${lang}/ProportionCodeAscending.md/`});
        export_to_file(`Statistics/${lang}/ProportionCodeAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => (a.goods.total === 0 ? -1 : a.goods.code / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.code / b.goods.total)), lang);

        export_to_file(`Statistics/${lang}/ProportionBlanksDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => (a.goods.total === 0 ? -1 : a.goods.blanks / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.blanks / b.goods.total)), lang, {propblanklink: `Statistics/${lang}/ProportionBlanksAscending.md/`});
        export_to_file(`Statistics/${lang}/ProportionBlanksAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => (a.goods.total === 0 ? -1 : a.goods.blanks / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.blanks / b.goods.total)), lang);

        export_to_file(`Statistics/${lang}/ProportionCommentsDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => (a.goods.total === 0 ? -1 : a.goods.comments / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.comments / b.goods.total)), lang, {propcommentlink: `Statistics/${lang}/ProportionCommentsAscending.md/`});
        export_to_file(`Statistics/${lang}/ProportionCommentsAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => (a.goods.total === 0 ? -1 : a.goods.comments / a.goods.total) - (b.goods.total === 0 ? -1 : b.goods.comments / b.goods.total)), lang);

        export_to_file(`Statistics/${lang}/NameDescending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((b, a) => a.name.split(`/`)[a.name.split(`/`).length - 1].localeCompare(b.name.split(`/`)[b.name.split(`/`).length - 1])), lang);
        export_to_file(`Statistics/${lang}/NameAscending.md`, ALL_DATA.filter(thing => getLang(thing.name).name === lang || lang === "total").sort((a, b) => a.name.split(`/`)[a.name.split(`/`).length - 1].localeCompare(b.name.split(`/`)[b.name.split(`/`).length - 1])), lang, {namelink: `Statistics/${lang}/NameDescending.md/`});
    });

    console.log(ALL_STATS);
    /*print("\nTotal" +
        "," + str(ALL_STATS.total) +
        "," + str(ALL_STATS.code) + "," +
        "," + str(ALL_STATS.comments) + "," +
        "," + str(ALL_STATS.blanks) + ",");*/
}

main();