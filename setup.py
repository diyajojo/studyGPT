from setuptools import setup, find_packages

setup(
    name="studyGPT",
    version="0.1",
    packages=find_packages(include=['server*']),
    python_requires='>=3.6',
)