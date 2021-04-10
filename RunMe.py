import logging
import os
import pprint
import sys
from os.path import join, isfile
from typing import Dict

REPO_URL = ""


def sort_lines(idk_what_this_is):
    return idk_what_this_is["goods"]["total"]


def sort_code(idk_what_this_is):
    return idk_what_this_is["goods"]["code"]


def sort_comment(idk_what_this_is):
    return idk_what_this_is["goods"]["comments"]


def sort_blank(idk_what_this_is):
    return idk_what_this_is["goods"]["blanks"]


def find_all_java_files():
    """
    finds all the dat files in "User_Generated_Files" folder
    :return:
    """
    all_files = []
    for dir_path, folders, foundFile in os.walk("src/main/java"):
        all_files += [join(dir_path, f) for f in foundFile if isfile(join(dir_path, f)) and f.__contains__(".java")]
    logger.info("Found: %d files", len(all_files))
    return all_files


def read_and_get_the_goods(filename: str):
    out = {"total": 0, "blanks": 0, "comments": 0, "code": 0}
    with open(filename) as java_file:
        lines = java_file.readlines()
    in_block_comment = False
    for index, line in enumerate(lines, start=1):
        out["total"] += 1
        if len(line.lstrip()) == 0:
            out["blanks"] += 1
            logger.debug("BLANK IN " + filename + ": " + str(index))
            continue
        if line.__contains__("/*"):
            in_block_comment = True
            if line.lstrip()[0:2] != "/*":
                out["code"] += 1
                out["comments"] -= 1
                logger.debug("CODE IN " + filename + ": " + str(index))
        if in_block_comment:
            out["comments"] += 1
            logger.debug("COMMENT IN " + filename + ": " + str(index) + " #" + str(out["comments"]))
            if line.__contains__("*/"):
                in_block_comment = False
            continue
        if line.lstrip()[0:2] == "//":
            logger.debug("COMMENT IN " + filename + ": " + str(index))
            out["comments"] += 1
            continue
        logger.debug("CODE IN " + filename + ": " + str(index))
        out["code"] += 1
    return out


def export_to_file(filename: str, ALL_DATA, totallinelink=REPO_URL + "Statistic/LinesDescending.md/",
                   totalcodelink=REPO_URL + "Statistic/CodeDescending.md/",
                   propcodelink=REPO_URL + "Statistic/ProportionCodeDescending.md/",
                   totalcommentlink=REPO_URL + "Statistic/CommentsDescending.md/",
                   propcommentlink=REPO_URL + "Statistic/ProportionCommentsDescending.md/",
                   totalblanklink=REPO_URL + "Statistic/BlanksDescending.md/",
                   propblanklink=REPO_URL + "Statistic/ProportionBlankDescending.md/"):
    logger.debug("I think the url is: " + REPO_URL)
    with open(filename, "w") as file:
        file.write(
            "\n|File|[Lines (% total)](" + totallinelink + ")|[Code Lines (% total)](" + totalcodelink + ")|[% Code](" + propcodelink + ")|[Comment Lines (% total)](" + totalcommentlink + ")|[% Comment](" + propcommentlink + ")|[Blank Lines (% total)](" + totalblanklink + ")|[% Blank](" + propblanklink + ")|")
        file.write("\n| --- | --- | --- | --- | --- | --- | --- | --- |")
        for index, goods in enumerate(ALL_DATA, start=1):
            file.write("\n|" + "[" + str(goods["name"]).split("/")[
                len(str(goods["name"]).split("/")) - 1] + "](" + REPO_URL + str(goods["name"]).replace("\\",
                                                                                                       "/") + ")" +
                       "|" + str(goods["goods"]["total"]) + " (" + str(
                format(100 * goods["goods"]["total"] / ALL_STATS["total"], ".1f")) + "%)" +
                       "|" + str(goods["goods"]["code"]) + " (" + str(
                format(100 * goods["goods"]["code"] / ALL_STATS["code"], ".1f")) + "%)" + "|" +
                       str(format(100 * goods["goods"]["code"] / goods["goods"]["total"], ".1f")) + "%" +
                       "|" + str(goods["goods"]["comments"]) + " (" + str(
                format(100 * goods["goods"]["comments"] / ALL_STATS["comments"], ".1f")) + "%)" + "|" +
                       str(format(100 * goods["goods"]["comments"] / goods["goods"]["total"], ".1f")) + "%" +
                       "|" + str(goods["goods"]["blanks"]) + " (" + str(
                format(100 * goods["goods"]["blanks"] / ALL_STATS["blanks"], ".1f")) + "%)" + "|" +
                       str(format(100 * goods["goods"]["blanks"] / goods["goods"]["total"], ".1f")) + "%|")
        file.write("\n|Total" +
                   "|" + str(ALL_STATS["total"]) +
                   "|" + str(ALL_STATS["code"]) + "| " +
                   "|" + str(ALL_STATS["comments"]) + "| " +
                   "|" + str(ALL_STATS["blanks"]) + "| |")


if __name__ == '__main__':
    # Test prints
    # Set the logger
    # noinspection PyArgumentList
    logging.basicConfig(format="[{asctime}] :--{levelname:-^9s}--: [{funcName}()] {message}",
                        datefmt="%d/%b/%Y %H:%M:%S",
                        style="{")
    logger = logging.getLogger()
    logger.setLevel(10)

    if len(sys.argv) < 2:
        sys.argv.append("Smaltin/CodeStats")
    if len(sys.argv) < 3:
        sys.argv.append("main")

    REPO_URL = "https://github.com/" + sys.argv[1] + "/tree/" + sys.argv[2] + "/"

    logger.debug(REPO_URL)
    # Get a list of all the java files
    ALL_FILES = find_all_java_files()
    ALL_STATS: Dict[str, int] = {"total": 0, "blanks": 0, "comments": 0, "code": 0}
    logger.debug(pprint.pformat(ALL_STATS))
    # Now write the text file
    ALL_DATA = []
    for fileName in ALL_FILES:
        ALL_DATA.append({"name": str(fileName).replace("\\", "/"), "goods": read_and_get_the_goods(fileName)})
    for index, goods in enumerate(ALL_DATA, start=1):
        ALL_STATS["total"] += goods["goods"]["total"]
        ALL_STATS["code"] += goods["goods"]["code"]
        ALL_STATS["comments"] += goods["goods"]["comments"]
        ALL_STATS["blanks"] += goods["goods"]["blanks"]
        print(str(goods["name"]).split("\\")[len(str(goods["name"]).split("\\")) - 1])
    with open("Statistic.csv", "w") as file:
        logger.info("Created the text file")
        file.write(
            "File,Lines (% total),Code Lines (% total),% Code,Comment Lines (% total),% Comment,Blank Lines (% total),% Blank")
        for index, goods in enumerate(ALL_DATA, start=1):
            file.write("\n" + str(goods["name"]).split("\\")[len(str(goods["name"]).split("\\")) - 1] +
                       "," + str(goods["goods"]["total"]) + " (" + str(
                format(100 * goods["goods"]["total"] / ALL_STATS["total"], ".1f")) + "%)" +
                       "," + str(goods["goods"]["code"]) + " (" + str(
                format(100 * goods["goods"]["code"] / ALL_STATS["code"], ".1f")) + "%)" + "," +
                       str(format(100 * goods["goods"]["code"] / goods["goods"]["total"], ".1f")) + "%" +
                       "," + str(goods["goods"]["comments"]) + " (" + str(
                format(100 * goods["goods"]["comments"] / ALL_STATS["comments"], ".1f")) + "%)" + "," +
                       str(format(100 * goods["goods"]["comments"] / goods["goods"]["total"], ".1f")) + "%" +
                       "," + str(goods["goods"]["blanks"]) + " (" + str(
                format(100 * goods["goods"]["blanks"] / ALL_STATS["blanks"], ".1f")) + "%)" + "," +
                       str(format(100 * goods["goods"]["blanks"] / goods["goods"]["total"], ".1f")) + "%"
                       )
        file.write("\nTotal" +
                   "," + str(ALL_STATS["total"]) +
                   "," + str(ALL_STATS["code"]) + "," +
                   "," + str(ALL_STATS["comments"]) + "," +
                   "," + str(ALL_STATS["blanks"]) + ",")
    if not os.path.exists("Statistics"):
        os.mkdir("Statistics")

    ALL_DATA.sort(reverse=True, key=sort_lines)
    export_to_file("Statistic.md", ALL_DATA)
    export_to_file("Statistics/LinesDescending.md", ALL_DATA, totallinelink=REPO_URL + "Statistic/LinesAscending.md/")
    ALL_DATA.sort(reverse=False, key=sort_lines)
    export_to_file("Statistics/LinesAscending.md", ALL_DATA)

    ALL_DATA.sort(reverse=True, key=sort_code)
    export_to_file("Statistics/CodeDescending.md", ALL_DATA, totalcodelink=REPO_URL + "Statistic/CodeAscending.md/")
    ALL_DATA.sort(reverse=False, key=sort_code)
    export_to_file("Statistics/CodeAscending.md", ALL_DATA)

    ALL_DATA.sort(reverse=True, key=sort_blank)
    export_to_file("Statistics/BlanksDescending.md", ALL_DATA, totalcodelink=REPO_URL + "Statistic/BlanksAscending.md/")
    ALL_DATA.sort(reverse=False, key=sort_blank)
    export_to_file("Statistics/BlanksAscending.md", ALL_DATA)

    ALL_DATA.sort(reverse=True, key=sort_comment)
    export_to_file("Statistics/CommentsDescending.md", ALL_DATA, totalcodelink=REPO_URL + "Statistic/CommentsAscending.md/")
    ALL_DATA.sort(reverse=False, key=sort_comment)
    export_to_file("Statistics/CommentsAscending.md", ALL_DATA)


    print("\nTotal" +
          "," + str(ALL_STATS["total"]) +
          "," + str(ALL_STATS["code"]) + "," +
          "," + str(ALL_STATS["comments"]) + "," +
          "," + str(ALL_STATS["blanks"]) + ",")
