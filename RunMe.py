import logging
import os
import pprint
from os.path import join, isfile
from typing import Tuple, Dict


def find_all_java_files():
    """
    finds all the dat files in "User_Generated_Files" folder
    :return:
    """
    all_files = []

    for dir_path, folders, file in os.walk("src/main/java"):
        all_files += [join(dir_path, f) for f in file if isfile(join(dir_path, f)) and f.__contains__(".java")]

    logger.info("Found: %d files", len(all_files))

    return all_files


def read_and_get_the_goods(filename: str):
    out = {"total": 0, "blanks": 0, "comments": 0, "code": 0}
    with open(filename) as java_file:
        lines = java_file.readlines()
    in_block_comment = False
    for line in lines:
        out["total"] += 1
        if line.__contains__("/*"):
            in_block_comment = True
        if in_block_comment:
            out["comments"] += 1
            if line.__contains__("*/"):
                in_block_comment = False
            continue
        if line.lstrip()[0:2] == "//":
            out["comments"] += 1
            continue
        if len(line.lstrip()) == 0:
            out["blanks"] += 1
            continue
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

    ALL_ALBUMS_WITH_ARTISTS: Dict[str, list] = {"Unknown Artist": []}
    stat_counter = {"total_songs": 0}
    # Go through each file.
    for dat_file in ALL_FILES:
        print(dat_file, ": ", read_and_get_the_goods(dat_file))

    logger.debug(pprint.pformat(ALL_ALBUMS_WITH_ARTISTS))

    # Now write the text file
    with open("Statistic.out", "w") as file:
        logger.info("Created the text file")