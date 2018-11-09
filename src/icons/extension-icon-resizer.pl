#!/usr/bin/env perl

use utf8;
#use strictures 2;
use strict;
use warnings;
use feature qw/say unicode_strings/;
use Encode::Locale;

# https://stackoverflow.com/a/39904532
#binmode STDOUT, ':encoding(UTF-8)';
#binmode STDOUT, ':utf8';
#use open ':std', ':encoding(UTF-8)';
#use open ':std', ':utf8';
binmode STDIN, ':utf8';
binmode STDOUT, ':encoding(console_out)';

my $o = $ARGV[0] or die('argv0');

my $sizes = [48, 64, 128];

foreach my $s (@$sizes) {
  system 'gm.exe', 'convert',
    '-size', "${s}x${s}", $o,
    '-resize', "${s}x${s}", "icon-${s}.png"
}
