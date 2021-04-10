import logging
import os
import pprint
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
        if in_block_comment:
            logger.debug("COMMENT IN " + filename + ": " + str(index))
            out["comments"] += 1
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
    # Get a list of all the dat files
    ALL_FILES = find_all_java_files()
    ALL_STATS: Dict[str, int] = {"total": 0, "blanks": 0, "comments": 0, "code": 0}
    logger.debug(pprint.pformat(ALL_STATS))
    # Now write the text file
    with open("Statistic.csv", "w") as file:
        logger.info("Created the text file")
        file.write("File,Lines,Code Lines,Comment Lines,Blank Lines")
        for index, statFile in enumerate(ALL_FILES, start=1):
            goods = read_and_get_the_goods(statFile)
            ALL_STATS["total"] += goods["total"]
            ALL_STATS["code"] += goods["code"]
            ALL_STATS["comments"] += goods["comments"]
            ALL_STATS["blanks"] += goods["blanks"]
            print(str(statFile).split("\\")[len(str(statFile).split("\\")) - 1])
            file.write("\n" + str(statFile).split("\\")[len(str(statFile).split("\\")) - 1] +
                       "," + str(goods["total"]) +
                       "," + str(goods["code"]) +
                       "," + str(goods["comments"]) +
                       "," + str(goods["blanks"]))
        file.write("\nTotal" +
                   "," + str(ALL_STATS["total"]) +
                   "," + str(ALL_STATS["code"]) +
                   "," + str(ALL_STATS["comments"]) +
                   "," + str(ALL_STATS["blanks"]))
        print("\nTotal" +
                   "," + str(ALL_STATS["total"]) +
                   "," + str(ALL_STATS["code"]) +
                   "," + str(ALL_STATS["comments"]) +
                   "," + str(ALL_STATS["blanks"]))

