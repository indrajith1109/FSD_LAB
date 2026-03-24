<?php
include 'includes/header.php';
include 'includes/db.php';
?>

<!-- HERO SECTION -->
<section class="hero">

<h1>Upgrade Your Skills With Industry Experts</h1>

<p>Join thousands of learners building their future.</p>

<a href="courses/course_list.php" class="btn">Explore Courses</a>

</section>

<section class="section">

<h2>Explore Top Categories</h2>

<div class="course-grid">

<div class="category-card">
<img src="assets/images/web development.png">
<h3>Web Development</h3>
</div>

<div class="category-card">
<img src="assets/images/ai.png">
<h3>Artificial Intelligence</h3>
</div>

<div class="category-card">
<img src="assets/images/ds.png">
<h3>Data Science</h3>
</div>

<div class="category-card">
<img src="assets/images/ui.png">
<h3>UI / UX Design</h3>
</div>

</div>

</section>

<!-- FEATURED COURSES -->
<section class="section">

<h2>Featured Courses</h2>

<div class="course-grid">

<?php

$result = $conn->query("SELECT * FROM courses LIMIT 6");

while($course=$result->fetch_assoc()){

?>

<div class="course-card">

<?php
    $candidate = !empty($course['thumbnail']) ? $course['thumbnail']
        : (!empty($course['image']) ? $course['image']
        : (!empty($course['images']) ? $course['images'] : ''));
    $candidate = basename($candidate);
    $img = (!empty($candidate) && file_exists("assets/images/" . $candidate)) ? $candidate : "default.png";
?>
<img src="assets/images/<?php echo $img; ?>">

<h3><?php echo $course['title']; ?></h3>

<p>₹<?php echo $course['price']; ?></p>

<a class="btn" href="courses/course_details.php?id=<?php echo $course['id']; ?>">
View Course
</a>

</div>

<?php } ?>

</div>

</section>

<!-- PLATFORM STATS -->
<section class="stats">

<div class="stats-grid">

<div>
<h1>10K+</h1>
<p>Students</p>
</div>

<div>
<h1>120+</h1>
<p>Courses</p>
</div>

<div>
<h1>50+</h1>
<p>Instructors</p>
</div>

<div>
<h1>4.8⭐</h1>
<p>Average Rating</p>
</div>

</div>

</section>
<section class="section">

<h2>Top Instructors</h2>

<div class="testimonial-container">

<div class="testimonial-card">

<img src="assets/images/student1.png" class="testimonial-img">

<h4>Rahul Sharma</h4>

<p>Full Stack Developer</p>

</div>

<div class="testimonial-card">

<img src="assets/images/student2.png" class="testimonial-img">

<h4>Sneha Patel</h4>

<p>AI Engineer</p>

</div>

</div>

</section>

<section class="certification-section">

<div class="cert-container">

<h2>Get Certified and Advance Your Career</h2>

<p>Earn industry-recognized certificates from Skill Academy.</p>

<a href="courses/course_list.php" class="cert-btn">
Browse Certification Programs
</a>

</div>

</section>


<!-- POPULAR SKILLS -->

<section class="skills-section">

<h2>Popular Skills</h2>

<div class="skills-container">

<span class="skill-pill">Python</span>
<span class="skill-pill">React</span>
<span class="skill-pill">Java</span>
<span class="skill-pill">Machine Learning</span>
<span class="skill-pill">Cloud Computing</span>
<span class="skill-pill">DevOps</span>

</div>

</section>

<!-- TESTIMONIALS -->
<section class="section">

<h2 style="text-align:center;">Student Testimonials</h2>

<div class="testimonial-container">

<div class="testimonial-card">

<img src="assets/images/student1.png" class="testimonial-img">

<div class="testimonial-stars">★★★★★</div>

<p>
"This platform helped me learn full-stack development and land my first job."
</p>

<b>Rahul Sharma</b>

</div>


<div class="testimonial-card">

<img src="assets/images/student2.png" class="testimonial-img">

<div class="testimonial-stars">★★★★★</div>

<p>
"The courses are structured very well and instructors are amazing."
</p>

<b>Sneha Patel</b>

</div>


<div class="testimonial-card">

<img src="assets/images/student3.png" class="testimonial-img">

<div class="testimonial-stars">★★★★★</div>

<p>
"I upgraded my programming skills within 3 months using this academy."
</p>

<b>Arjun Kumar</b>

</div>

</div>

</section>

<?php include 'includes/footer.php'; ?>