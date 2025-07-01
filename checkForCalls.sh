#!/bin/bash

# Checks for unused javascript functions in the given folder ($1)

# Check for argument
if [ $# -eq 0 ]
  then
    echo "Need input folder as argument."
    exit 2
fi

# Store in separate file the function found
grep "function .*(.*)" -r $1 > jsFunctions.txt

      used=()
maybe_used=()
  not_used=()

while read -r line; do

  calls_s=$(echo -n "$line" | # Piping `$ling` to stdin
    awk '{ print $2 }'      | # Skipping 'function' word
    grep -c -f - -r $1      | # Take stdin as pattern and search
    grep -o ":[1-9][0-9]*")   # Get number of calls from each file != 0

  declare -i sum=0
  for call_s in $calls_s; do
    # Remove ':' character
    declare -i call="${call_s:1}"
    sum=$((sum+call))
  done

  if [ $sum -lt 2 ]
    then
      not_used+=$line
  elif [ $sum -eq 3 ]
    then
      maybe_used+=$line
    else
      used+=$line
  fi

done < <(grep -o "function [^(]*" jsFunctions.txt) # Process substitution, same
                                                   # as `jsFunctions.txt` except
                                                   # only prints matching part
                                                   # and clips the arguments

echo -e "\e[1;32mUsed\e[0m:"
for u in $used; do
  echo "    - $u"
done

echo -e "\e[1;33mNeed manual check\e[0m:"
for m in $maybe_used; do
  echo "    - $m"
done

echo -e "\e[1;31mNot used\e[0m:"
for n in $not_used; do
  echo "    - $n"
done
