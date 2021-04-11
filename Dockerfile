FROM python:3.8-alpine

RUN apk --update --no-cache add git bash

COPY "RunMe.py" "/RunMe.py"
COPY "Statistics/Settings.json" "/Statistics/Settings.json"

ENTRYPOINT ["python", "/RunMe.py"]