import { Users, Star, TrendingUp, Heart } from 'lucide-react';

const stats = [
  { icon: Users, value: '100K+', label: 'Monthly Visitors' },
  { icon: Star, value: '500+', label: 'Anime Reviews' },
  { icon: TrendingUp, value: '1K+', label: 'News Articles' },
  { icon: Heart, value: '50K+', label: 'Happy Fans' },
];

const team = [
  {
    name: 'Founder',
    role: 'CEO & Editor-in-Chief',
    bio: 'Passionate anime fan with over 20 years of experience in the industry.',
  },
  {
    name: 'Content Lead',
    role: 'Head of Content',
    bio: 'Dedicated to bringing you the latest and most accurate anime news.',
  },
  {
    name: 'Tech Lead',
    role: 'Lead Developer',
    bio: 'Building the best platform for anime enthusiasts worldwide.',
  },
];

const values = [
  {
    title: 'Passion',
    description: 'We are driven by our love for anime and the community around it.',
  },
  {
    title: 'Quality',
    description: 'We strive to provide accurate, well-researched, and engaging content.',
  },
  {
    title: 'Community',
    description: 'We believe in the power of bringing anime fans together.',
  },
  {
    title: 'Innovation',
    description: 'We constantly evolve to provide the best user experience.',
  },
];

export const metadata = {
  title: 'About Us | AnimePulse',
  description: 'Learn about AnimePulse and our mission to bring you the best anime content.',
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AnimePulse</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Your ultimate destination for anime news, reviews, and community. 
            We&apos;re passionate fans dedicated to bringing you the best content from the world of anime.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              To create the most comprehensive and engaging platform for anime fans worldwide, 
              providing accurate news, thoughtful reviews, and a vibrant community space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl text-center">
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Meet Our Team</h2>
            <p className="text-gray-400">The passionate people behind AnimePulse</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-gray-800 p-8 rounded-xl text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{member.name[0]}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-indigo-400 mb-4">{member.role}</p>
                <p className="text-gray-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Community</h2>
          <p className="text-gray-400 mb-8">
            Be part of the growing AnimePulse family. Get the latest updates, participate in discussions, 
            and connect with fellow anime fans.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Explore AnimePulse
          </a>
        </div>
      </section>
    </div>
  );
}
