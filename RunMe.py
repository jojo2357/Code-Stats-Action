import logging
import os
import pprint
import sys
from os.path import join, isfile
from typing import Dict


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


if __name__ == '__main__':
    # Test prints
    # Set the logger
    # noinspection PyArgumentList
    logging.basicConfig(format="[{asctime}] :--{levelname:-^9s}--: [{funcName}()] {message}",
                        datefmt="%d/%b/%Y %H:%M:%S",
                        style="{")
    logger = logging.getLogger()
    logger.setLevel(10)

    logger.debug(sys.argv)
    # Get a list of all the java files
    ALL_FILES = find_all_java_files()
    ALL_STATS: Dict[str, int] = {"total": 0, "blanks": 0, "comments": 0, "code": 0}
    logger.debug(pprint.pformat(ALL_STATS))
    # Now write the text file
    ALL_DATA = []
    for fileName in ALL_FILES:
        ALL_DATA.append({"name": fileName, "goods": read_and_get_the_goods(fileName)})
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
    with open("Statistic.md", "w") as file:
        file.write(
            "\n|File|Lines (% total)|Code Lines (% total)|% Code|Comment Lines (% total)|% Comment|Blank Lines (% total)|% Blank|")
        file.write("\n| --- | --- | --- | --- | --- | --- | --- | --- |")
        for index, goods in enumerate(ALL_DATA, start=1):
            file.write("\n|" + "[" + str(goods["name"]).split("/")[len(str(goods["name"]).split("/")) - 1] + "](https://github.com/" + sys.argv[1] + "/tree/" + sys.argv[2] + "/" + str(goods["name"]).replace("\\", "/") + ")" +
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

    print("\nTotal" +
          "," + str(ALL_STATS["total"]) +
          "," + str(ALL_STATS["code"]) + "," +
          "," + str(ALL_STATS["comments"]) + "," +
          "," + str(ALL_STATS["blanks"]) + ",")
