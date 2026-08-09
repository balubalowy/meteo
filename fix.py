with open('app/js/clouds-data.js', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('"assets/img/placeholder_cc.png"', '""')
text = text.replace('"assets/img/wiedza/if_scale_1.png"', '""')
text = text.replace('"assets/img/wiedza/if_scale_2.png"', '""')
text = text.replace('"assets/img/wiedza/if_scale_7.png"', '""')
text = text.replace('"assets/img/wiedza/if_scale_8.png"', '""')
with open('app/js/clouds-data.js', 'w', encoding='utf-8') as f:
    f.write(text)
