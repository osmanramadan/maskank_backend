INSERT INTO governorates (name_ar, name_en)
VALUES
    ('دمياط', 'Damietta'),
    ('القاهرة', 'Cairo'),
    ('الإسكندرية', 'Alexandria'),
    ('الدقهلية', 'Dakahlia'),
    ('البحر الأحمر', 'Red Sea')
ON CONFLICT (name_en) DO NOTHING;

INSERT INTO cities (governorate_id, name_ar, name_en)
SELECT g.id, locations.name_ar, locations.name_en
FROM governorates AS g
JOIN (
    VALUES
        ('Damietta', 'دمياط', 'Damietta'),
        ('Damietta', 'دمياط الجديدة', 'New Damietta'),
        ('Damietta', 'فارسكور', 'Faraskour'),
        ('Damietta', 'كفر سعد', 'Kafr Saad'),
        ('Cairo', 'مدينة نصر', 'Nasr City'),
        ('Cairo', 'المعادي', 'Maadi'),
        ('Cairo', 'التجمع الخامس', 'New Cairo'),
        ('Alexandria', 'سموحة', 'Smouha'),
        ('Alexandria', 'سيدي جابر', 'Sidi Gaber'),
        ('Dakahlia', 'المنصورة', 'Mansoura'),
        ('Red Sea', 'الغردقة', 'Hurghada')
) AS locations(governorate_name, name_ar, name_en)
    ON locations.governorate_name = g.name_en
ON CONFLICT (governorate_id, name_en) DO NOTHING;

INSERT INTO areas (city_id, name_ar, name_en)
SELECT c.id, locations.name_ar, locations.name_en
FROM cities AS c
JOIN governorates AS g ON g.id = c.governorate_id
JOIN (
    VALUES
        ('Damietta', 'New Damietta', 'الحي الأول', 'First District'),
        ('Damietta', 'New Damietta', 'الحي الثاني', 'Second District'),
        ('Cairo', 'Nasr City', 'الحي السابع', 'Seventh District'),
        ('Cairo', 'New Cairo', 'النرجس', 'Al Narges'),
        ('Alexandria', 'Smouha', 'سموحة الجديدة', 'New Smouha'),
        ('Dakahlia', 'Mansoura', 'حي الجامعة', 'University District'),
        ('Red Sea', 'Hurghada', 'الكوثر', 'Al Kawther')
) AS locations(governorate_name, city_name, name_ar, name_en)
    ON locations.governorate_name = g.name_en
   AND locations.city_name = c.name_en
ON CONFLICT (city_id, name_en) DO NOTHING;






