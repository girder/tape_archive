# -*- coding: utf-8 -*-
import os

from setuptools import find_packages, setup



# perform the install
setup(
    name='tape-archive',
    version='2.0.0',
    description='Adds support to filesystem assetstores for storing Girder files within compressed or \
                 uncompressed tape archive (TAR) files via import and export processes.',
    author='Kitware, Inc.',
    author_email='kitware@kitware.com',
    url='https://github.com/girder/tape_archive',
    license='Apache 2.0',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.5'
    ],
    include_package_data=True,
    packages=find_packages('tape_archive'),
    # zip_safe=False,
    install_requires=['girder>=3.0.0a1'],
    entry_points={
        'girder.plugin': [
            'tape-archive = tape_archive:TapeArchivePlugin'
        ]
    }
)